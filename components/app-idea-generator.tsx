"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download } from "lucide-react";
import {
  generateAppVariation,
  generateFreindlyResultMessage,
  generateFriendlyMessage,
  generateFriendlyTweakingMessage,
  voiceMessage,
} from "@/lib/api";
import { VariationNode } from "@/components/variation-node";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import SpeechToText from "@/components/speech-to-text";

const tailwindCDN = "https://cdn.tailwindcss.com";

interface Variation {
  id: number;
  name: string;
  html: string;
  htmlImg: string;
  children: Variation[];
  version: string;
}

export function AppIdeaGenerator() {
  const [idea, setIdea] = useState("");
  const [tweak, setTweak] = useState("");
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  const globalMessages = useRef<Array<{ role: string; content: string }>>([
    {
      role: "system",
      content: `You a helpful assistant that writes code to create mini apps/utilities, you do it only using html, css, and javascript in a single HTML file.
Based on the user's request, generate a single HTML file that solves their problem.
Include only HTML where you will put JavaScript inside <script> tag and CSS inside <style> tag. Make sure the HTML structure is semantic and accessible. Do not use browser alerts to interrupt user experience. Any app/utility you create should follow the rules I described before. Do not answer with your own explanations/responses, give me just a html file as a string. Return an error message for any prompts that are off-topic.`,
    },
  ]);

  const { toast } = useToast();

  const generateVariation = async (baseIdea: string, iteration: number) => {
    const prompt =
      iteration === 0
        ? `App idea: ${baseIdea}`
        : `Improve the following app idea. Make the UI and UX beautiful and add more features that can fit in a single file: ${baseIdea}`;

    globalMessages.current.push({ role: "user", content: prompt });

    try {
      const { htmlContent } = await generateAppVariation(
        globalMessages.current,
      );

      // Call your screenshot API
      const screenshotResponse = await fetch("/api/screenshot", {
        method: "POST",
        body: htmlContent,
      });

      if (screenshotResponse.ok) {
        const screenshotBlob = await screenshotResponse.blob();
        const htmlImg = URL.createObjectURL(screenshotBlob);

        return {
          id: Date.now() + iteration,
          name: `Variation ${iteration + 1}`,
          html: htmlContent,
          htmlImg: htmlImg,
          children: [],
          version: `v1`, // Initial version for new variations
        };
      }
    } catch (error) {
      console.error(`Error generating variation ${iteration + 1}:`, error);
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!idea) return;
    setIsLoading(true);
    setLoadingProgress(0);
    setVariations([]);

    try {
      const newVariations: Variation[] = [];

      const stop = generateFriendlyMessage(idea).then(voiceMessage);

      const variations = await Promise.all(
        new Array(3).fill(0).map((i) => {
          return generateVariation(idea, i);
        }),
      );

      variations.forEach((variation, i) => {
        if (variation) {
          newVariations.push(variation);
          setVariations(newVariations);
          setLoadingProgress((i + 1) * 33);
        }
      });

      // for (let i = 0; i < 3; i++) {
      //   const variation = await generateVariation(idea, i);
      //   if (variation) {
      //     newVariations.push(variation);
      //     setVariations(newVariations);
      //     setLoadingProgress((i + 1) * 33);
      //   }
      // }

      setIdea("");
      if (newVariations.length > 0) {
        setSelectedVariation(newVariations[0]);
        stop.then((cal) => cal());
        generateFreindlyResultMessage(idea).then(voiceMessage);
      }
    } catch (error) {
      console.error("Error in generate process:", error);
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
    }
  };

  const handleTweak = async () => {
    if (!selectedVariation || !tweak) return;
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      const newVersion = `v${parseInt(selectedVariation.version.slice(1), 10) + 1}`;
      const tweakShortName =
        tweak.length > 20 ? tweak.substring(0, 20) + "..." : tweak;

      generateFriendlyTweakingMessage(idea, tweak).then(voiceMessage);

      for (let i = 0; i < 3; i++) {
        const tweakPrompt =
          i === 0
            ? tweak
            : `Further improve the app based on this tweak: ${tweak}`;
        globalMessages.current.push({ role: "user", content: tweakPrompt });

        const { htmlContent } = await generateAppVariation(
          globalMessages.current,
        );
        const screenshotResponse = await fetch("/api/screenshot", {
          method: "POST",
          body: htmlContent,
        });

        let htmlImg = "";
        if (screenshotResponse.ok) {
          const screenshotBlob = await screenshotResponse.blob();
          htmlImg = URL.createObjectURL(screenshotBlob);
        } else {
          console.error("Error generating screenshot for tweaked variation");
        }

        const tweakedVariation: Variation = {
          id: Date.now() + i,
          name: `Tweaked ${selectedVariation.name} ${i + 1}`,
          html: htmlContent,
          htmlImg: htmlImg,
          children: [],
          version: `${newVersion} - ${tweakShortName}`,
        };

        setVariations((prevVariations) => [
          ...prevVariations,
          tweakedVariation,
        ]);
        setSelectedVariation(tweakedVariation);
        setLoadingProgress((i + 1) * 33);

        // Add a small delay to make the addition of new variations more visible
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setTweak("");
    } catch (error) {
      console.error("Error tweaking variation:", error);
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
    }
  };

  const injectTailwindCSS = (html: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="${tailwindCDN}"></script>
          <style>
            /* Reset default styles */
            html, body, div, span, applet, object, iframe,
            h1, h2, h3, h4, h5, h6, p, blockquote, pre,
            a, abbr, acronym, address, big, cite, code,
            del, dfn, em, img, ins, kbd, q, s, samp,
            small, strike, strong, sub, sup, tt, var,
            b, u, i, center,
            dl, dt, dd, ol, ul, li,
            fieldset, form, label, legend,
            table, caption, tbody, tfoot, thead, tr, th, td,
            article, aside, canvas, details, embed,
            figure, figcaption, footer, header, hgroup,
            menu, nav, output, ruby, section, summary,
            time, mark, audio, video {
              margin: 0;
              padding: 0;
              border: 0;
              font-size: 100%;
              font: inherit;
              vertical-align: baseline;
            }
            /* HTML5 display-role reset for older browsers */
            article, aside, details, figcaption, figure,
            footer, header, hgroup, menu, nav, section {
              display: block;
            }
            body {
              line-height: 1;
            }
            ol, ul {
              list-style: none;
            }
            blockquote, q {
              quotes: none;
            }
            blockquote:before, blockquote:after,
            q:before, q:after {
              content: '';
              content: none;
            }
            table {
              border-collapse: collapse;
              border-spacing: 0;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
  };

  const handleCopyCode = () => {
    if (selectedVariation) {
      navigator.clipboard.writeText(selectedVariation.html);
      toast({
        title: "Code Copied",
      });
    }
  };

  const handleDownloadCode = () => {
    if (selectedVariation) {
      const blob = new Blob([selectedVariation.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `variation-${selectedVariation.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      <div className="w-1/2 overflow-y-auto relative flex flex-col">
        {variations.length > 0 ? (
          <>
            <h1 className="text-4xl p-4 font-bold mb-8 text-center">
              App Idea : {idea}
            </h1>
          </>
        ) : (
          <div className="flex flex-col p-4 gap-3">
            <h1 className="text-4xl font-bold mb-8 text-center">
              <Image src="/logo.png" width={300} height={20} alt={""} />
            </h1>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Enter your app idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <SpeechToText setUserTranscript={setIdea} />
            </div>
            <Button
              onClick={handleGenerate}
              className="w-full mb-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !idea}
            >
              {isLoading
                ? `Generating... ${loadingProgress}%`
                : "Generate Variations"}
            </Button>
          </div>
        )}

        <div className="flex-1 p-4">
          <VariationNode
            variations={variations}
            onSelect={setSelectedVariation}
            selectedVariation={selectedVariation}
          />
        </div>

        {selectedVariation && (
          <div className="sticky bottom-0 bg-white border-t border-gray-300 left-0 right-0 p-4">
            <div className="flex w-full gap-3 mb-3">
              <Textarea
                placeholder="Request a tweak for the selected variation"
                value={tweak}
                onChange={(e) => setTweak(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <SpeechToText setUserTranscript={setTweak}></SpeechToText>
            </div>

            <Button
              onClick={handleTweak}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !tweak}
            >
              {isLoading
                ? `Tweaking... ${loadingProgress}%`
                : "Tweak Variation"}
            </Button>
          </div>
        )}
      </div>

      <div className="w-1/2 p-8 bg-white h-screen overflow-auto flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-center">App Preview</h2>

        {selectedVariation ? (
          <Tabs
            className="flex flex-col flex-grow overflow-auto"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "preview" | "code")}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>

              <Button
                size="sm"
                onClick={handleDownloadCode}
                className="ml-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </TabsList>
            <TabsContent value="preview">
              <iframe
                srcDoc={injectTailwindCSS(selectedVariation.html)}
                className="w-full h-[calc(100vh-200px)] border rounded-lg shadow-lg"
                title="Selected Variation"
                sandbox="allow-scripts"
              />
            </TabsContent>
            <TabsContent value="code" className="overflow-auto rounded-lg">
              <div className="relative flex-grow overflow-auto flex flex-col">
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{selectedVariation.html}</code>
                </pre>
                <div className="absolute top-2 right-2 space-x-2">
                  <Button
                    size="sm"
                    onClick={handleCopyCode}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Image
            src="/slog.png"
            width={300}
            height={20}
            alt={""}
            className="m-auto"
          />
        )}
      </div>
    </div>
  );
}
