import datetime
from typing import List

from aiocache import cached
from sqlalchemy import sql, and_, desc, text

from . import db
from .request_type import RequestType
from .source import Source


class ServiceRequest(db.Model):
    __tablename__ = 'service_requests'

    request_id = db.Column(db.Integer, primary_key=True)
    srnumber = db.Column(db.String, unique=True)
    created_date = db.Column(db.Date)
    closed_date = db.Column(db.Date)
    type_id = db.Column(db.SmallInteger, db.ForeignKey('request_types.type_id'))
    agency_id = db.Column(db.SmallInteger, db.ForeignKey('agencies.agency_id'))
    source_id = db.Column(db.SmallInteger, db.ForeignKey('sources.source_id'))
    council_id = db.Column(db.SmallInteger, db.ForeignKey('councils.council_id'))
    region_id = db.Column(db.SmallInteger)
    address = db.Column(db.String)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    @classmethod
    async def one(cls, id: int):
        from .council import Council  # noqa ... avoiding circular import
        from .agency import Agency  # noqa ... avoiding circular import

        result = await (
            db.select(
                [
                    ServiceRequest,
                    RequestType.type_name,
                    Council.council_name,
                    Agency.agency_name,
                    Source.source_name
                ]
            ).select_from(
                ServiceRequest.join(
                    RequestType
                ).join(
                    Council
                ).join(
                    Agency, ServiceRequest.agency_id == Agency.agency_id
                ).join(
                    Source, ServiceRequest.source_id == Source.source_id
                )
            ).where(
                ServiceRequest.request_id == id
            ).gino.first()
        )
        return result

    @classmethod
    async def get_request_reports(
            cls,
            start_date: datetime.date,
            end_date: datetime.date
    ):
        from .council import Council  # noqa ... avoiding circular import

        result = await (
            db.select(
                [
                    RequestType.type_name,
                    Council.council_name,
                    ServiceRequest.created_date,
                    db.func.count().label("counts")
                ]
            ).select_from(
                ServiceRequest.join(RequestType).join(Council)
            ).where(
                sql.and_(
                    ServiceRequest.created_date >= start_date,
                    ServiceRequest.created_date <= end_date
                )
            ).group_by(
                RequestType.type_name,
                Council.council_name,
                ServiceRequest.created_date
            ).gino.all()
        )
        return result

    @classmethod
    async def get_recent_requests(cls, start_date: datetime.date):

        result = await (
            db.select(
                ServiceRequest
            ).where(
                ServiceRequest.created_date >= start_date
            ).order_by(
                desc(ServiceRequest.created_date)
            ).gino.all()
        )
        return result


async def get_full_request(srnumber: str):
    # query the request table to get full record
    query = db.text("SELECT * FROM requests WHERE srnumber = :num")
    result = await db.first(query, num=srnumber)
    return result


# TODO: no cache as this appears to be too big for redis (e.g. 2+ MB)
# @cached(key="Request.open", alias="default")
async def get_open_requests() -> List[ServiceRequest]:

    result = await (
        db.select(
            [
                ServiceRequest.request_id,
                ServiceRequest.srnumber,
                ServiceRequest.type_id,
                ServiceRequest.latitude,
                ServiceRequest.longitude
            ]
        ).where(
            ServiceRequest.closed_date == None  # noqa
        ).gino.all()
    )
    return result


async def get_id_from_srnumber(srnumber: str):
    result = await (
        db.select(
            ServiceRequest
        ).where(
            ServiceRequest.srnumber == srnumber
        ).gino.scalar()
    )
    return result


@cached(key="Request.open_type_counts", alias="default")
async def get_open_request_counts():
    result = await (
        db.select(
            [
                ServiceRequest.type_id,
                RequestType.type_name,
                db.func.count().label("type_count")
            ]
        ).select_from(
            ServiceRequest.join(RequestType)
        ).where(
            and_(
                ServiceRequest.closed_date == None,  # noqa
            )
        ).group_by(
            ServiceRequest.type_id,
            RequestType.type_name
        ).gino.all()
    )
    return result


@cached(alias="default")
async def get_filtered_requests(
        start_date: datetime.date = None,
        end_date: datetime.date = None,
        type_ids: List[int] = None,
        council_ids: List[int] = None,
        include_updated: bool = False,
        offset: int = 0,
        limit: int = 100000
):
    from .council import Council  # noqa ... avoiding circular import
    from .agency import Agency  # noqa ... avoiding circular import

    where_text = []

    if (start_date):
        if include_updated:
            where_text.append(f"(created_date >= '{start_date}' OR closed_date >= '{start_date}')")  # noqa
        else:
            where_text.append(f"created_date >= '{start_date}'")

    if (end_date):
        # Making end date inclusive by adding one
        end_date = end_date + datetime.timedelta(days=1)

        if include_updated:
            where_text.append(f"(created_date <= '{end_date}' OR closed_date <= '{end_date}')")  # noqa
        else:
            where_text.append(f"created_date <= '{end_date}'")

    if (type_ids):
        where_text.append(f"service_requests.type_id IN ({', '.join([str(i) for i in type_ids])})")  # noqa
    if (council_ids):
        where_text.append(f"service_requests.council_id IN ({', '.join([str(i) for i in council_ids])})")  # noqa

    result = await (
        db.select(
            [
                ServiceRequest,
                RequestType.type_name,
                Council.council_name,
                Agency.agency_name,
                Source.source_name,
            ]
        ).select_from(
            ServiceRequest.join(
                RequestType
            ).join(
                Council
            ).join(
                Agency, ServiceRequest.agency_id == Agency.agency_id
            ).join(
                Source, ServiceRequest.source_id == Source.source_id
            )
        ).where(
            text(" AND ".join(where_text))
        ).order_by(
            desc(ServiceRequest.created_date)
        ).limit(
            limit
        ).offset(
            offset
        ).gino.all()
    )

    return result
