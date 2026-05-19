from flask import Flask, render_template, request, redirect, url_for, flash
from database import init_db, get_db

app = Flask(__name__)
app.secret_key = "secret-key-change-in-production"


@app.before_request
def setup():
    init_db()


@app.route("/")
def index():
    db = get_db()
    courses = db.execute("SELECT * FROM courses ORDER BY name").fetchall()
    return render_template("index.html", courses=courses)


@app.route("/register", methods=["GET", "POST"])
def register():
    db = get_db()
    courses = db.execute("SELECT * FROM courses ORDER BY name").fetchall()

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        phone = request.form.get("phone", "").strip()
        course_id = request.form.get("course_id", "").strip()

        errors = []
        if not name:
            errors.append("กรุณากรอกชื่อ-นามสกุล")
        if not email:
            errors.append("กรุณากรอกอีเมล")
        if not course_id:
            errors.append("กรุณาเลือกคอร์ส")

        if not errors:
            existing = db.execute(
                "SELECT id FROM registrations WHERE email = ? AND course_id = ?",
                (email, course_id),
            ).fetchone()
            if existing:
                errors.append("อีเมลนี้ลงทะเบียนคอร์สนี้ไปแล้ว")

        if errors:
            for e in errors:
                flash(e, "error")
            return render_template("register.html", courses=courses)

        db.execute(
            "INSERT INTO registrations (name, email, phone, course_id) VALUES (?, ?, ?, ?)",
            (name, email, phone, course_id),
        )
        db.commit()
        flash("ลงทะเบียนสำเร็จ! ขอบคุณครับ", "success")
        return redirect(url_for("success"))

    return render_template("register.html", courses=courses)


@app.route("/success")
def success():
    return render_template("success.html")


@app.route("/admin")
def admin():
    db = get_db()
    rows = db.execute(
        """
        SELECT r.id, r.name, r.email, r.phone, c.name AS course_name, r.created_at
        FROM registrations r
        JOIN courses c ON r.course_id = c.id
        ORDER BY r.created_at DESC
        """
    ).fetchall()
    total = db.execute("SELECT COUNT(*) FROM registrations").fetchone()[0]
    return render_template("admin.html", rows=rows, total=total)


@app.route("/admin/add-course", methods=["POST"])
def add_course():
    db = get_db()
    name = request.form.get("name", "").strip()
    description = request.form.get("description", "").strip()
    price = request.form.get("price", "0").strip()

    if name:
        db.execute(
            "INSERT INTO courses (name, description, price) VALUES (?, ?, ?)",
            (name, description, price),
        )
        db.commit()
        flash(f'เพิ่มคอร์ส "{name}" สำเร็จ', "success")
    return redirect(url_for("admin"))


@app.route("/admin/delete-registration/<int:reg_id>", methods=["POST"])
def delete_registration(reg_id):
    db = get_db()
    db.execute("DELETE FROM registrations WHERE id = ?", (reg_id,))
    db.commit()
    flash("ลบข้อมูลสำเร็จ", "success")
    return redirect(url_for("admin"))


if __name__ == "__main__":
    app.run(debug=True)
