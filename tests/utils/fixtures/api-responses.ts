/**
 * API response fixtures for testing
 */

// Sample Gemini API response for a professional comment
export const professionalCommentResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: "Thank you for sharing this insightful post. Your points about data-driven decision making are particularly relevant in today's business environment. I've found that incorporating quantitative analysis alongside qualitative feedback creates the most robust framework for strategic planning. Would be interested to hear more about how you've implemented these approaches in your organization."
          }
        ],
        role: "model"
      },
      finishReason: "STOP",
      index: 0,
      safetyRatings: [
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          probability: "NEGLIGIBLE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          probability: "NEGLIGIBLE"
        }
      ]
    }
  ],
  promptFeedback: {
    safetyRatings: [
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        probability: "NEGLIGIBLE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        probability: "NEGLIGIBLE"
      }
    ]
  }
};

// Sample Gemini API response for a casual comment
export const casualCommentResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: "Love this post! 👍 Data is definitely king these days. I've been trying to be more data-driven in my own work and it makes such a huge difference. Sometimes the numbers tell you things you'd never see otherwise. Have you tried any particular tools that work well for your team?"
          }
        ],
        role: "model"
      },
      finishReason: "STOP",
      index: 0,
      safetyRatings: [
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          probability: "NEGLIGIBLE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          probability: "NEGLIGIBLE"
        }
      ]
    }
  ],
  promptFeedback: {
    safetyRatings: [
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        probability: "NEGLIGIBLE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        probability: "NEGLIGIBLE"
      }
    ]
  }
};

// Sample Gemini API error response
export const errorResponse = {
  error: {
    code: 400,
    message: "Invalid API key",
    status: "INVALID_ARGUMENT",
    details: [
      {
        "@type": "type.googleapis.com/google.rpc.BadRequest",
        "fieldViolations": [
          {
            "field": "api_key",
            "description": "API key not valid"
          }
        ]
      }
    ]
  }
};

// Sample post content for testing
export const samplePostContent = {
  text: "Data-driven decision making is transforming how businesses operate. By analyzing customer behavior, market trends, and operational metrics, companies can make more informed strategic choices. What tools or approaches have you found most effective for implementing data-driven strategies in your organization?",
  author: {
    name: "Jane Smith",
    title: "Chief Data Officer at TechCorp"
  },
  hasImage: false
}; 