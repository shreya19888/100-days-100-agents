import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { dataset } = await req.json();

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
Dataset:
${dataset}

You are a senior Staff Data Engineer creating enterprise-grade dataset documentation.

Return well-formatted GitHub Markdown.

Use EXACTLY the following sections in this order.

# 📊 Executive Summary

A concise 2-3 sentence overview.

---

# 🎯 Business Problem Solved

Explain why this dataset exists and what business capability it enables.

---

# 📋 Dataset Overview

Create a markdown table with:

| Column | Type | Description |

---

# 🏗️ Typical Producers

Bullet list.

---

# 👥 Typical Consumers

Create a markdown table with:

| Team | Use Case |

---

# 📈 Sample Analytics Questions

Provide 5 bullet points.

---

# 💻 Common SQL Patterns

Include THREE SQL code blocks.

---

# ⭐ Important Columns

Create a markdown table:

| Column | Importance | Why It Matters |

Use ⭐ ratings.

---

# 🔗 Common Joins

Provide TWO SQL examples.

---

# ✅ Data Quality Checks

Provide a checklist using:

- ✔

---

# 🔒 Governance

Provide bullet points.

---

# 🌐 Lineage

Use this format:

Upstream Systems

↓

Current Dataset

↓

Downstream Consumers

---

# 💡 Best Practices

Provide 5 recommendations.

---

# 🎓 Recommended Learning

Create a markdown table:

| Resource | Description |

IMPORTANT:

- Use headings.
- Use markdown tables.
- Use bullet lists.
- Use SQL code fences.
- Use emojis in section headers.
- Never return plain text.
- Make the response look like enterprise documentation from DataHub or Microsoft Purview.
`,
        },
        {
          role: "user",
          content: `Explain the enterprise dataset "${dataset}" for a new data engineer.`,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      {
        answer: "Unable to generate AI insights right now.",
      },
      {
        status: 500,
      },
    );
  }
}