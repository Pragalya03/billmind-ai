from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class BillItem(Base):
    __tablename__ = "bill_items"
    id = Column(Integer, primary_key=True)
    item = Column(String)
    qty = Column(Integer)
    price = Column(Float)
    confidence = Column(Float)
