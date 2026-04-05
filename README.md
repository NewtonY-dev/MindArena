# MindArena

**An Interactive learning platform for students**

MindArena is a gamified learning platform designed for students from primary school to high school. It helps students practice class-based and subject-specific questions, track progress, and stay motivated through points, rankings, and structured feedback.

The project is built around one main idea: make learning more interactive, personalized, and competitive while still being simple enough to work well in low-connectivity environments.

---

## Project Overview

Many students struggle to stay consistent with practice because learning is often passive, unstructured, and not engaging enough. MindArena solves this by giving students a place to:

- practice by class and subject
- receive instant feedback
- track performance over time
- compete with classmates
- build confidence through repeated practice

The platform is inspired by coding challenge platforms like LeetCode, but adapted for school learning.

---

## Problem Statement

Students often face these issues:

- No engaging platform for regular practice
- Limited feedback after answering questions
- Weak motivation to keep learning consistently
- Inconsistent access to quality practice materials
- Little personalization based on grade level or performance

---

## Proposed Solution

MindArena provides a structured learning experience where students can:

- practice questions based on their class and subject
- get immediate feedback after answering
- monitor their growth with points and accuracy
- compare progress on class leaderboards
- revisit weak topics through personalized recommendations

---

## Core Features

### Student Dashboard

A personalized home page that shows:

- current class and selected subjects
- progress summary
- points and streaks
- recommended questions
- upcoming contests or learning activities
- real time one vs one challenge

### Class-Based Questions

Questions are organized by:

- grade/class
- subject
- difficulty level

Supported question types include:

- Multiple Choice
- True/False
- Short Answer
- Fill in the Blank
- Coding exercises for higher grades

Each question may also include:

- hints
- explanations
- bookmark option
- flag for later review

### Subject Selection & Personalization

Students can choose their favorite subjects and focus areas. The platform can then recommend questions based on:

- weak topics
- previous attempts
- popular questions among peers

### Ranking System

MindArena includes a competitive ranking system such as:

- class-wide ranking
- subject-specific ranking
- school or regional leaderboard later

Gamification elements include:

- points for correct answers
- bonus points for streaks
- trophies and badges

### Contests & Competitions

Students can participate in:

- weekly or monthly quizzes
- timed or untimed contests
- live leaderboard challenges
- class-vs-class competitions

### Study Groups / Peer Learning

Students can create or join learning groups to:

- discuss topics
- solve problems together
- complete challenges as a group

### Progress Tracking & Analytics

Students can see:

- accuracy per subject
- time spent on questions
- weak and strong topics
- learning progress over time

---

## Relationships

- A **User** belongs to one **GradeLevel**
- A **User** can select many **Subjects**
- A **GradeLevel** can contain many **Users**
- A **GradeLevel** can have many **Questions**
- A **Subject** can have many **Questions**
- A **Question** can have many **Attempts**
- A **User** can make many **Attempts**

---

## Product Vision

MindArena is designed to become more than just a question-answer app. The long-term vision is to create a full learning ecosystem where students can:

- practice daily
- compete fairly
- collaborate with peers
- understand their weaknesses
- improve consistently

The platform aims to make academic practice feel engaging, rewarding, and easy to use.

---

## Why MindArena Matters

MindArena brings together learning, competition, and progress tracking in one platform. Instead of passive study, students get an active environment that encourages regular practice and measurable improvement.

It is especially useful for students who need:

- structured revision
- motivation to keep studying
- better feedback on performance
- a simple way to track growth over time

---

## Summary

MindArena is a gamified learning platform that helps students practice by grade and subject, receive instant feedback, and stay motivated through points and leaderboards. The MVP focuses on authentication, profile setup, practice, feedback, progress tracking, and a simple leaderboard.

The goal is to deliver a simple but powerful learning experience that can grow into a larger educational platform over time.
