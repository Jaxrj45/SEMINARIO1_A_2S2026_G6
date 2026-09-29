import datetime as dt
from extensions import db

class FileRecord(db.Model):
    __tablename__ = "files"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # image | text | other
    url = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "url": self.url,
            "createdAt": self.created_at.isoformat()
        }