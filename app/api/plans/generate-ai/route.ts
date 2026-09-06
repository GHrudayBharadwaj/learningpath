import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { executeAiPrompt } from "@/lib/ai/client";
import { addDays, format } from "date-fns";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      goal = "Comprehensive Study Curriculum",
      subject = "Computer Science",
      daysCount = 14,
      hoursPerDay = 2,
      difficulty = "intermediate",
      startDate = format(new Date(), "yyyy-MM-dd"),
      aiProvider = "offline",
      apiKey,
    } = body;

    const numDays = Math.min(Math.max(Number(daysCount) || 14, 1), 90);
    const dailyMins = Math.round((Number(hoursPerDay) || 2) * 60);
    const baseDate = new Date(startDate);
    const validBaseDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;

    // Build prompt for AI model if external AI is chosen
    const systemPrompt = `You are an expert curriculum designer and academic planner. 
Output ONLY a valid JSON array of study tasks with NO markdown code block wrappers, NO text outside JSON.
Each object must have:
- dayNumber: number (1 to ${numDays})
- topic: string
- subtopic: string
- durationMinutes: number (e.g. ${dailyMins})
- priority: "low" | "medium" | "high" | "urgent"
- practicePlatform: string (e.g. "LeetCode", "GeeksforGeeks", "HackerRank", "YouTube", "Official Docs")
- practiceUrl: string
- notesSummary: string`;

    const userPrompt = `Create a ${numDays}-day day-wise study roadmap for:
Subject: ${subject}
Goal: ${goal}
Difficulty: ${difficulty}
Daily Study Time: ${hoursPerDay} hours (${dailyMins} mins/day).

Return JSON array of ${numDays} day-wise learning tasks.`;

    let generatedTasks: any[] = [];

    if (aiProvider !== "offline" && apiKey) {
      try {
        const aiResult = await executeAiPrompt(userPrompt, systemPrompt, {
          provider: aiProvider,
          apiKey,
        });

        const cleanedJson = aiResult.text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanedJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          generatedTasks = parsed;
        }
      } catch (err) {
        console.warn("AI generation fallback to academic engine:", err);
      }
    }

    // High quality offline fallback curriculum generator
    if (generatedTasks.length === 0) {
      generatedTasks = generateCurriculumTemplate(subject, goal, numDays, dailyMins, difficulty);
    }

    // Structure tasks with calculated dates
    const dayGroupsMap = new Map<string, any>();
    const allTasks: any[] = [];

    generatedTasks.forEach((item, idx) => {
      const dayNum = item.dayNumber || (idx % numDays) + 1;
      const taskDate = format(addDays(validBaseDate, dayNum - 1), "yyyy-MM-dd");
      const duration = item.durationMinutes || dailyMins;

      const formattedTask = {
        title: `${subject}: ${item.topic || `Day ${dayNum} Target`}`,
        subject: subject,
        topic: item.topic || `Core Milestone ${dayNum}`,
        subtopic: item.subtopic || `Key concepts, syntax, and exercises`,
        scheduledDate: taskDate,
        dayNumber: dayNum,
        dayLabel: `Day ${dayNum}`,
        durationMinutes: duration,
        priority: item.priority || (dayNum % 3 === 0 ? "high" : "medium"),
        status: "not_started",
        practicePlatform: item.practicePlatform || (subject.toLowerCase().includes("code") || subject.toLowerCase().includes("dsa") || subject.toLowerCase().includes("java") ? "LeetCode" : "GeeksforGeeks"),
        practiceUrl: item.practiceUrl || "https://leetcode.com",
        notesSummary: item.notesSummary || `Comprehensive notes and exercises for ${item.topic || `Day ${dayNum}`}.`,
      };

      allTasks.push(formattedTask);

      if (!dayGroupsMap.has(taskDate)) {
        dayGroupsMap.set(taskDate, {
          dayNumber: dayNum,
          date: taskDate,
          dayLabel: `Day ${dayNum}`,
          tasksCount: 0,
          totalDurationMinutes: 0,
          tasks: [],
        });
      }

      const group = dayGroupsMap.get(taskDate)!;
      group.tasksCount += 1;
      group.totalDurationMinutes += duration;
      group.tasks.push(formattedTask);
    });

    const dayGroups = Array.from(dayGroupsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    const totalHours = Math.round((allTasks.reduce((sum, t) => sum + t.durationMinutes, 0) / 60) * 10) / 10;
    const endDate = dayGroups[dayGroups.length - 1]?.date || startDate;

    const planTitle = `${subject} ${numDays}-Day Roadmap: ${goal.length > 30 ? goal.slice(0, 30) + "..." : goal}`;

    return NextResponse.json({
      success: true,
      plan: {
        title: planTitle,
        description: `AI-generated ${numDays}-day day-wise study roadmap covering ${subject} at ${difficulty} level (${hoursPerDay}h/day).`,
        subject,
        startDate,
        targetDate: endDate,
        endDate,
        totalDays: numDays,
        totalHours,
      },
      dayGroups,
      tasks: allTasks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate AI study plan" }, { status: 500 });
  }
}

function generateCurriculumTemplate(
  subject: string,
  goal: string,
  daysCount: number,
  durationMins: number,
  difficulty: string
): any[] {
  const s = subject.toLowerCase();
  let topicPool: Array<{ topic: string; subtopic: string; platform: string; priority: string }> = [];

  if (s.includes("java")) {
    topicPool = [
      { topic: "Java Fundamentals & JVM Architecture", subtopic: "JDK, JRE, Bytecode, Variables & Primitive Types", platform: "GeeksforGeeks", priority: "medium" },
      { topic: "Control Flow & Methods", subtopic: "Conditionals, Loops, Switch Expressions & Recursion", platform: "HackerRank", priority: "medium" },
      { topic: "Object-Oriented Programming (OOP) - Part 1", subtopic: "Classes, Objects, Encapsulation, Constructors & this keyword", platform: "GeeksforGeeks", priority: "high" },
      { topic: "OOP - Inheritance & Polymorphism", subtopic: "Method Overriding, Overloading, super keyword & Abstract Classes", platform: "GeeksforGeeks", priority: "high" },
      { topic: "Interfaces & Lambda Expressions", subtopic: "Functional Interfaces, Default Methods & Lambdas", platform: "Official Docs", priority: "high" },
      { topic: "Java Collections Framework - Lists & Sets", subtopic: "ArrayList, LinkedList, HashSet, TreeSet & Iterators", platform: "LeetCode", priority: "urgent" },
      { topic: "Collections Framework - Maps & Queues", subtopic: "HashMap, TreeMap, PriorityQueue, ArrayDeque & HashCode contract", platform: "LeetCode", priority: "urgent" },
      { topic: "Exception Handling & File I/O", subtopic: "Try-Catch-Finally, Custom Exceptions, Try-with-resources & NIO.2", platform: "GeeksforGeeks", priority: "medium" },
      { topic: "Multithreading & Concurrency", subtopic: "Thread lifecycle, Runnable, Synchronized blocks, Locks & Executors", platform: "GeeksforGeeks", priority: "high" },
      { topic: "Java Streams API & Optional", subtopic: "Map, Filter, Reduce, Collect, Stream pipelines & Optional safety", platform: "HackerRank", priority: "high" },
      { topic: "Generics & Annotations", subtopic: "Generic classes, Bounded type parameters, Wildcards & Custom Annotations", platform: "Official Docs", priority: "medium" },
      { topic: "Spring Boot & RESTful APIs", subtopic: "Dependency Injection, Controllers, Services, Repositories & DTOs", platform: "Spring Guides", priority: "high" },
      { topic: "Hibernate, JPA & Database Integration", subtopic: "Entity mappings, Spring Data JPA, HQL, JPQL & Connection Pools", platform: "GeeksforGeeks", priority: "high" },
      { topic: "Testing & Unit Verification", subtopic: "JUnit 5, Mockito, AssertJ & Integration testing", platform: "Official Docs", priority: "medium" },
      { topic: "Design Patterns in Java", subtopic: "Singleton, Factory, Builder, Strategy & Observer patterns", platform: "RefactoringGuru", priority: "high" },
      { topic: "Java Memory Management & GC", subtopic: "Heap vs Stack, Garbage Collection algorithms & Memory tuning", platform: "GeeksforGeeks", priority: "high" },
    ];
  } else if (s.includes("dsa") || s.includes("algorithm") || s.includes("structure") || s.includes("leetcode")) {
    topicPool = [
      { topic: "Time & Space Complexity Analysis", subtopic: "Big-O, Omega, Theta, Master Theorem & Recurrence relations", platform: "GeeksforGeeks", priority: "high" },
      { topic: "Arrays & Dynamic Sizing", subtopic: "Prefix Sums, Two Pointers, Sliding Window & Kadane's Algorithm", platform: "LeetCode", priority: "urgent" },
      { topic: "Strings & Pattern Matching", subtopic: "String hashing, KMP Algorithm, Palindromes & Anagrams", platform: "LeetCode", priority: "high" },
      { topic: "Linked Lists & Pointer Logic", subtopic: "Singly, Doubly, Fast & Slow Pointers (Floyd Cycle), Reversal", platform: "LeetCode", priority: "urgent" },
      { topic: "Stacks & Monotonic Stack Patterns", subtopic: "Next Greater Element, Valid Parentheses & Stock Span", platform: "LeetCode", priority: "urgent" },
      { topic: "Queues & Sliding Window Maximum", subtopic: "Double-Ended Queues (Deque), Priority Queue & Min-Max heaps", platform: "LeetCode", priority: "high" },
      { topic: "Recursion & Backtracking", subtopic: "Subsets, Permutations, Combination Sum & N-Queens problem", platform: "LeetCode", priority: "urgent" },
      { topic: "Binary Search Patterns", subtopic: "Rotated Sorted Arrays, Search Space Reduction & Aggressive Cows", platform: "LeetCode", priority: "urgent" },
      { topic: "Trees & Tree Traversals", subtopic: "DFS, BFS Level Order, Height, Diameter, Lowest Common Ancestor (LCA)", platform: "LeetCode", priority: "urgent" },
      { topic: "Binary Search Trees (BST)", subtopic: "Validate BST, Inorder Successor, Insert/Delete & AVL Concepts", platform: "LeetCode", priority: "high" },
      { topic: "Heaps & Top-K Elements", subtopic: "Min-Heap, Max-Heap, Median in a Stream & Merge K Sorted Lists", platform: "LeetCode", priority: "urgent" },
      { topic: "Graphs - BFS & DFS", subtopic: "Connected components, Cycle detection in Directed & Undirected graphs", platform: "LeetCode", priority: "urgent" },
      { topic: "Shortest Path & MST", subtopic: "Dijkstra Algorithm, Bellman-Ford, Prim's & Kruskal's with Disjoint Set Union", platform: "LeetCode", priority: "high" },
      { topic: "Dynamic Programming - 1D State", subtopic: "Climbing Stairs, House Robber, Coin Change & Memoization", platform: "LeetCode", priority: "urgent" },
      { topic: "Dynamic Programming - 2D & Knapsack", subtopic: "0/1 Knapsack, Unbounded Knapsack, Longest Common Subsequence (LCS)", platform: "LeetCode", priority: "urgent" },
      { topic: "Bit Manipulation & Math", subtopic: "Bitwise XOR tricks, Counting Bits, Prime Sieve of Eratosthenes", platform: "LeetCode", priority: "medium" },
    ];
  } else if (s.includes("python") || s.includes("ai") || s.includes("machine learning") || s.includes("data science")) {
    topicPool = [
      { topic: "Python Core & Advanced Syntax", subtopic: "List Comprehensions, Generators, Decorators & Context Managers", platform: "HackerRank", priority: "medium" },
      { topic: "NumPy & Vectorized Mathematics", subtopic: "N-dimensional arrays, Broadcasting, Dot products & Linear Algebra", platform: "Kaggle", priority: "high" },
      { topic: "Pandas for Data Manipulation", subtopic: "DataFrames, Series, GroupBy, Merging, Pivoting & Missing Values", platform: "Kaggle", priority: "high" },
      { topic: "Data Visualization & EDA", subtopic: "Matplotlib, Seaborn, Feature distribution & Correlation matrices", platform: "Kaggle", priority: "medium" },
      { topic: "Supervised Learning - Regression", subtopic: "Linear Regression, Cost functions, Gradient Descent & Ridge/Lasso", platform: "Scikit-Learn Docs", priority: "high" },
      { topic: "Supervised Learning - Classification", subtopic: "Logistic Regression, Decision Trees, Random Forests & SVM", platform: "Scikit-Learn Docs", priority: "urgent" },
      { topic: "Unsupervised Learning & Clustering", subtopic: "K-Means, Hierarchical Clustering, PCA Dimensionality Reduction", platform: "Scikit-Learn Docs", priority: "medium" },
      { topic: "Model Evaluation & Hyperparameter Tuning", subtopic: "Cross-Validation, Precision-Recall, ROC-AUC, GridSearch & Optuna", platform: "Kaggle", priority: "high" },
      { topic: "Neural Networks & Deep Learning", subtopic: "Perceptrons, Multi-Layer Perceptrons (MLP), Activation Functions & Backpropagation", platform: "PyTorch Docs", priority: "urgent" },
      { topic: "PyTorch & Tensor Operations", subtopic: "Autograd, Custom Dataset Loaders, Training loops & Loss functions", platform: "PyTorch Tutorials", priority: "urgent" },
      { topic: "Convolutional Neural Networks (CNN)", subtopic: "Convolutions, Pooling, ResNet architectures & Transfer Learning", platform: "PyTorch Tutorials", priority: "high" },
      { topic: "Natural Language Processing (NLP)", subtopic: "Tokenization, Word2Vec, Embeddings & Attention Mechanism", platform: "HuggingFace", priority: "high" },
      { topic: "Transformer Architectures & LLMs", subtopic: "Self-Attention, Multi-Head Attention, BERT, GPT & Prompt Engineering", platform: "HuggingFace", priority: "urgent" },
      { topic: "RAG & Vector Databases", subtopic: "Embeddings, Vector Search, FAISS, LangChain & Document Retrieval", platform: "Pinecone Guides", priority: "urgent" },
    ];
  } else {
    // General Engineering & Computer Science
    topicPool = [
      { topic: "Foundational Principles & Architecture", subtopic: "Core definitions, system boundaries & essential paradigms", platform: "Textbook", priority: "medium" },
      { topic: "Core Mechanisms & Step-by-Step Logic", subtopic: "State management, computational kernel & invariants", platform: "Official Docs", priority: "high" },
      { topic: "Structured Implementation & Code Patterns", subtopic: "Modular engineering, error handling & unit tests", platform: "GitHub", priority: "high" },
      { topic: "Data Flow & State Transitions", subtopic: "Processing pipeline, transformation rules & assertions", platform: "Article", priority: "medium" },
      { topic: "Performance Optimization & Complexity", subtopic: "Asymptotic efficiency, bottleneck reduction & memory bounds", platform: "GeeksforGeeks", priority: "urgent" },
      { topic: "Real-World Architecture & Case Studies", subtopic: "Production deployment, microservices & enterprise design", platform: "Case Studies", priority: "high" },
      { topic: "Review, Practice Problems & Exam Prep", subtopic: "Mock question sets, past exam papers & rapid revision", platform: "Practice Portal", priority: "urgent" },
    ];
  }

  const tasks: any[] = [];
  for (let i = 0; i < daysCount; i++) {
    const poolItem = topicPool[i % topicPool.length];
    const cycle = Math.floor(i / topicPool.length) + 1;
    const topicTitle = cycle > 1 ? `${poolItem.topic} (Advanced Deep Dive)` : poolItem.topic;

    tasks.push({
      dayNumber: i + 1,
      topic: topicTitle,
      subtopic: poolItem.subtopic,
      durationMinutes: durationMins,
      priority: poolItem.priority,
      practicePlatform: poolItem.platform,
      practiceUrl: poolItem.platform === "LeetCode" ? "https://leetcode.com" : "https://www.geeksforgeeks.org",
      notesSummary: `Key learning points, formula derivations, and exercises for ${topicTitle}.`,
    });
  }

  return tasks;
}
