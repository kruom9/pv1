import sqlite3
from flask import g
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "registrations.db")


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            course_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id)
        );
        """
    )
    # Seed default courses if empty
    count = db.execute("SELECT COUNT(*) FROM courses").fetchone()[0]
    if count == 0:
        db.executemany(
            "INSERT INTO courses (name, description, price) VALUES (?, ?, ?)",
            [
                ("Python เบื้องต้น", "เรียนรู้ Python ตั้งแต่ต้น เหมาะสำหรับผู้เริ่มต้น", 2900),
                ("Web Development ด้วย Flask", "สร้างเว็บแอปด้วย Python Flask", 3900),
                ("Data Science & Machine Learning", "วิเคราะห์ข้อมูลและ ML ด้วย Python", 5900),
                ("SQL & Database Design", "ออกแบบและจัดการฐานข้อมูล", 2500),
            ],
        )
    db.commit()
    db.close()
