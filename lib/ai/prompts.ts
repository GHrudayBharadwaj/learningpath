export interface PromptParams {
  topic: string;
  subject: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  length?: "short" | "medium" | "detailed";
  purpose?: "exam" | "interview" | "coding" | "competitive_programming" | "revision";
  noteType?: "standard" | "exam_2mark" | "exam_5mark" | "exam_10mark" | "coding_practice";
  language?: string;
  contextChunks?: Array<{ title: string; content: string; sourceType: string }>;
}

export function buildSystemPrompt(params: PromptParams): string {
  return `You are an expert Academic Tutor, Computer Science Professor, and Technical Interview Coach.
Your goal is to generate pristine, student-friendly, highly structured study notes in simple English.
Always follow these core guidelines:
1. Use clear Markdown headings (#, ##, ###), bold key concepts, bullet lists, and code blocks.
2. If context sources are provided, strictly synthesize from them and include verified citations. Never invent external citations or links.
3. Keep technical depth aligned with difficulty: ${params.difficulty || "intermediate"}.
4. Provide structured, exam-ready and interview-tested explanations.`;
}

export function buildUserPrompt(params: PromptParams): string {
  const { topic, subject, difficulty = "intermediate", length = "medium", purpose = "exam", noteType = "standard", language = "English", contextChunks = [] } = params;

  let contextBlock = "";
  if (contextChunks && contextChunks.length > 0) {
    contextBlock = `\n\n### Verified Source References Provided for this Topic:\n` +
      contextChunks.map((c, i) => `[Source ${i + 1}: ${c.title} (${c.sourceType})]\n${c.content}\n`).join("\n");
  }

  if (noteType === "exam_2mark" || noteType === "exam_5mark" || noteType === "exam_10mark") {
    return `Generate University Exam Notes for:
Subject: ${subject}
Topic: ${topic}
Target Exam Note Type: ${noteType.toUpperCase().replace("_", " ")}
Language: ${language}
${contextBlock}

Requirements:
- If 2-mark: Provide a short, precise definition and 2 crucial bullet points.
- If 5-mark: Provide definition, structured explanation, and 1 illustrative diagram or code example.
- If 10-mark: Provide introduction, underlying principle, step-by-step detailed explanation, architecture diagram/flow, real-world applications, advantages/disadvantages, and conclusion.`;
  }

  if (noteType === "coding_practice" || purpose === "coding" || purpose === "competitive_programming") {
    return `Generate a Complete Coding Practice & Interview Preparation Guide for:
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Language: ${language}
${contextBlock}

Please structure the guide as follows:
1. # Core Concept & Problem Summary
2. ## Standard Problem Statement (Input, Output, Constraints)
3. ## Beginner Code Example
4. ## Optimal Production/Interview Solution (with clean comments)
5. ## Time and Space Complexity Analysis (using \\(O(...)\\) math notation)
6. ## Edge Cases & Common Pitfalls
7. ## Top 3 Interview Questions & Key Answers
8. ## Verified Practice Platforms (LeetCode / GeeksforGeeks / HackerRank search guidance)`;
  }

  return `Generate Comprehensive Study Notes for:
Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Note Length: ${length}
Primary Purpose: ${purpose}
Language: ${language}
${contextBlock}

Please structure the notes using the following complete format:
# ${topic} (${subject})

## 1. Learning Objectives
- What the student will learn

## 2. Definition & Core Summary
- Simple, student-friendly definition

## 3. Detailed Explanation & Key Concepts
- Deep breakdown of mechanisms, invariants, and concepts

## 4. Syntax & Practical Code Examples
- High quality code snippet with comments

## 5. Worked Example / Walkthrough
- Step-by-step example problem and solution

## 6. Applications & Real-World Use Cases
- Industry applications

## 7. Advantages & Disadvantages
- Pros and cons breakdown

## 8. Common Mistakes & Edge Cases
- Pitfalls to avoid

## 9. Top Interview & Exam Questions
- 3 representative questions with brief answers

## 10. Quick Revision Notes
- 3 bullet summary for fast exam review

## 11. Sources Used
- List of verified sources cited`;
}
