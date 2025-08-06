# Essential Software Development Guidelines for AI

This guide establishes the best practices you should follow when generating, analyzing, or modifying code. The goal is to ensure functional, clean, scalable, and easily maintainable software.

---

## 1. Interaction and Version Control (Git)

Your main guideline is to act as an assistant. The final control always belongs to the developer.

-   **Action on Demand:** **NEVER** perform `git commit`, `git push`, or any other action that alters the repository history, unless explicitly requested by the user. Your role is to generate code or commands, and the developer decides when and how to version them.
-   **Context is King:** When suggesting changes, always consider the existing code. Generated code should integrate cohesively with the project's established architecture and style.

## 2. Clean Code

Write code for humans, not just for machines.

-   **Clear Naming:** Variables, functions, and classes should have self-explanatory names. Avoid unnecessary abbreviations.
    -   *Bad:* `const d = new Date();`
    -   *Good:* `const currentDate = new Date();`
-   **Small and Focused Functions (Single Responsibility Principle):** Each function should do **one thing** and do it well. If a function performs multiple steps, break it into smaller functions.
-   **Avoid Repetition (DRY - Don't Repeat Yourself):** If a code snippet repeats in multiple places, abstract it into a reusable function or class.
-   **Useful Comments:** Comment on **why** a complex implementation decision was made, not **what** the code is doing. The code itself should explain the "what".
-   **Simplicity (KISS - Keep It Simple, Stupid):** Always prefer the simplest and most readable solution that solves the problem. Avoid unnecessary complexity.

## 3. Estrutura e Organização de Projetos

A organização dos arquivos dita a escalabilidade e a manutenção do projeto. Sempre siga a convenção da linguagem ou framework.

## 3. Project Structure and Organization

File organization dictates the scalability and maintenance of the project. Always follow the language or framework conventions.

-   **Separation of Concerns:** Keep business logic, user interface, data access, and configurations in separate layers or modules.
-   **Standard Structure by Project Type:**

    -   **Web API (e.g., Node.js/Express or Python/Flask):**
        ```
        /
        ├── src/
        │   ├── controllers/  # Request/response logic
        │   ├── services/     # Business logic
        │   ├── routes/       # Route definitions
        │   └── models/       # Database schemas
        ├── tests/            # Tests
        ├── config/           # Configuration files
        └── package.json
        ```

    -   **Simple Script (e.g., Python):**
        ```
        /
        ├── scripts/
        │   └── my_script.py
        ├── utils/
        │   └── helpers.py    # Helper functions
        ├── tests/
        │   └── test_helpers.py
        └── requirements.txt
        ```

## 4. Testing and Reliability

**Code without tests is broken code.**

-   **Generate Unit Tests:** When creating a function, suggest or create a corresponding unit test that validates its expected behavior and edge cases.
-   **Coverage Focus:** Encourage the practice of maintaining good test coverage to ensure that the main system functionalities are protected against regressions.

## 5. Dependency Management

A project should be reproducible in any environment.

-   **Dependency Manifest:** Always declare external dependencies in an appropriate file.
    -   **Python:** `requirements.txt` or `pyproject.toml`
    -   **Node.js:** `package.json`
    -   **Java:** `pom.xml` or `build.gradle`
-   **Specific Versions:** Fix dependency versions to prevent automatic updates from breaking the project.

## Summary
Your goal is to produce code that not only **works**, but is **professional**. Professional code is clean, well-structured, testable, and easy to understand by other developers. Always think about the next person who will read your code.