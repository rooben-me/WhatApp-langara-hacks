async function getHTMLLink(htmlContent: string): Promise<string> {
  const apiEndpoint =
    "https://rasulomaroff-htmlgen--3000.prod1a.defang.dev/html-gen";
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ html: htmlContent }),
  });

  const data = await response.json();
  return data.file;
}

async function extractHTML(response: string): Promise<string> {
  const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/);
  if (htmlMatch) {
    return htmlMatch[1].trim();
  }

  return "";
}

const apiEndpointGroq = "https://openrouter.ai/api/v1/chat/completions";
const headersGroq = {
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
  "Content-Type": "application/json",
};

export async function generateFriendlyMessage(idea: string): Promise<string> {
  const requestDataGroq = {
    model: "google/gemini-flash-1.5",
    messages: [
      {
        role: "system",
        content: `
        You are a friendly assistant. Our user wants to generate an app or utility with this idea: ${idea}.
        You have to respond with a friendly message saying that their app is being generated using our services.
        You can give compliments to the idea and add a story to spend some time. Respond just with a message as a string.
        Be verbose, friendly, you can also joke to make experience of waiting more fun and engaging!
      `,
      },
    ],
  };

  const responseGroq = await fetch(apiEndpointGroq, {
    method: "POST",
    headers: headersGroq,
    body: JSON.stringify(requestDataGroq),
  });

  const json = await responseGroq.json();

  return json.choices[0].message.content;
}

export function voiceMessage(message: string): Promise<() => void> {
  return fetch(
    "https://rasulomaroff-htmlgen--3000.prod1a.defang.dev/voice-gen",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
      }),
    },
  )
    .then((response) => response.blob())
    .then((blob) => {
      const audio = new Audio(URL.createObjectURL(blob));

      audio.play();

      return () => audio.pause();
    });
}

export async function generateFreindlyResultMessage(
  idea: string,
): Promise<string> {
  const requestDataGroq = {
    model: "google/gemini-flash-1.5",
    messages: [
      {
        role: "system",
        content: `
        You are a friendly assistant. Our user wants to generate an app or utility with this idea: ${idea}.
        We already generated 3 versions of it and you have to respond with a friendly message saying that their apps are ready
        to be used. Respond just with a message as a string.
        Be friendly, you can also joke to make experience of waiting more fun and engaging!
      `,
      },
    ],
  };

  const responseGroq = await fetch(apiEndpointGroq, {
    method: "POST",
    headers: headersGroq,
    body: JSON.stringify(requestDataGroq),
  });

  const json = await responseGroq.json();

  return json.choices[0].message.content;
}

export async function generateFriendlyTweakingMessage(
  idea: string,
  tweaks: string,
): Promise<string> {
  const requestDataGroq = {
    model: "google/gemini-flash-1.5",
    messages: [
      {
        role: "system",
        content: `
        You are a friendly assistant. Our user wants to generate an app or utility with this idea: ${idea}.
        We already generated 3 versions of it, but the user wants to tweak it with this message: ${tweaks}
        You have to respond with a friendly message saying that their apps are being tweaked using our services.
        You can give compliments to the tweaks and add a story to spend some time. Respond just with a message as a string.
        Be verbose, friendly, you can also joke to make experience of waiting more fun and engaging!
      `,
      },
    ],
  };

  const responseGroq = await fetch(apiEndpointGroq, {
    method: "POST",
    headers: headersGroq,
    body: JSON.stringify(requestDataGroq),
  });

  const json = await responseGroq.json();

  return json.choices[0].message.content;
}

export async function generateAppVariation(
  messages: Array<{ role: string; content: string }>,
): Promise<{ htmlContent: string; htmlLink: string }> {
  async function callAI(
    msgs: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const requestDataGroq = {
      model: "anthropic/claude-3.5-sonnet",
      messages: msgs,
    };

    const responseGroq = await fetch(apiEndpointGroq, {
      method: "POST",
      headers: headersGroq,
      body: JSON.stringify(requestDataGroq),
    });

    const transformedStatement = await responseGroq.json();
    return transformedStatement.choices[0].message.content;
  }

  // First attempt
  let assistantResponse = await callAI(messages);
  console.log(assistantResponse, "assistantResponse (first attempt)");

  let htmlContent = await extractHTML(assistantResponse);

  // If no HTML found, try again with a more specific request
  if (!htmlContent) {
    const newMessage = {
      role: "user",
      content:
        "Please provide your response in HTML format, enclosed in ```html ``` tags.",
    };
    const updatedMessages = [...messages, newMessage];

    assistantResponse = await callAI(updatedMessages);
    console.log(assistantResponse, "assistantResponse (second attempt)");

    htmlContent = await extractHTML(assistantResponse);
  }

  // If HTML content is found, get the link using the provided API
  if (htmlContent) {
    try {
      const htmlLink = await getHTMLLink(htmlContent);
      return { htmlContent, htmlLink };
    } catch (error) {
      console.error("Error getting HTML link:", error);
      return { htmlContent, htmlLink: "Error: Unable to generate HTML link" };
    }
  }

  // If no HTML content is found, return the full response and an error message for the link
  return {
    htmlContent: assistantResponse,
    htmlLink: "Error: No HTML content found to generate link",
  };
}
