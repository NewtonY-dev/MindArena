# MindArena

## Data Models

### Model: User
Description: Student account for the learning platform.

**Attributes:**
- id (INT, AUTO_INCREMENT, PRIMARY KEY) — Unique user identifier.
- email (VARCHAR(255), required, unique) — User login email.
- passwordHash (VARCHAR(255), required) — Encrypted password.
- displayName (VARCHAR(100)) — Optional name or nickname.
- gradeLevelId (INT, required) — Linked grade level.
- createdAt (DATETIME, required) — Account creation time.
- points (INT, default 0) — Total earned points.

**Relationships:**
- User → GradeLevel (many-to-one): each student belongs to one grade level.
- User ↔ Subject (many-to-many): each student can select multiple subjects (and each subject can have many students).
- User → Attempt (one-to-many): a student can make many answer attempts.

### Model: GradeLevel
Description: Academic grade or class (e.g. "Grade 5").

**Attributes:**
- id (INT, AUTO_INCREMENT, PRIMARY KEY) — Unique grade identifier.
- name (VARCHAR(100), required, unique) — Grade label (e.g. "Grade 5").

**Relationships:**
- GradeLevel → User (one-to-many): one grade level includes many students.
- GradeLevel → Question (one-to-many): one grade level can have many questions.

### Model: Subject
Description: Academic subject (e.g. Math, English).

**Attributes:**
- id (INT, AUTO_INCREMENT, PRIMARY KEY) — Unique subject identifier.
- name (VARCHAR(100), required, unique) — Subject name.

**Relationships:**
- Subject → Question (one-to-many): each subject can have many questions.
- Subject ↔ User (many-to-many): each subject can be chosen by many students (and each student can choose many subjects).

### Model: Question
Description: A practice question for students.

**Attributes:**
- id (INT, AUTO_INCREMENT, PRIMARY KEY) — Unique question identifier.
- gradeLevelId (INT, required) — Linked grade level.
- subjectId (INT, required) — Linked subject.
- content (TEXT, required) — Question text.
- correctAnswer (TEXT, required) — Correct answer.
- hint (TEXT) — Optional hint.
- explanation (TEXT) — Optional explanation.
- difficultyLevel (VARCHAR(50)) — Difficulty label.

**Relationships:**
- Question → GradeLevel (many-to-one): each question is tagged with one grade level.
- Question → Subject (many-to-one): each question belongs to one subject.
- Question → Attempt (one-to-many): one question can have many student attempts.

### Model: Attempt
Description: A student's attempt to answer a question.

**Attributes:**
- id (INT, AUTO_INCREMENT, PRIMARY KEY) — Unique attempt identifier.
- userId (INT, required) — Linked user.
- questionId (INT, required) — Linked question.
- answerGiven (TEXT, required) — Submitted answer.
- isCorrect (BOOLEAN, required) — Correctness flag.
- createdAt (DATETIME, required) — Attempt time.

**Relationships:**
- Attempt → User (many-to-one): each attempt is made by one student.
- Attempt → Question (many-to-one): each attempt is for one question.

### Join Table: UserSubject
Description: Join table for User-Subject many-to-many relationship.

**Attributes:**
- userId (INT, required) — Linked user.
- subjectId (INT, required) — Linked subject.

**Relationships:**
- UserSubject → User (many-to-one): each entry belongs to one user.
- UserSubject → Subject (many-to-one): each entry belongs to one subject.

## Notes

- All id fields use `INT AUTO_INCREMENT PRIMARY KEY` for efficient indexing.
- Required fields must be non-null; for example, email, passwordHash, gradeLevelId, question content, and correctAnswer are all required.
- Foreign keys reference the corresponding model's id field (INT type).
