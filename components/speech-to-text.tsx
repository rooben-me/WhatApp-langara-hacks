import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

interface AlertProps {
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ children }) => {
  return (
    <div
      className="flex items-start p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg"
      role="alert"
    >
      {children}
    </div>
  );
};

interface AlertTitleProps {
  children: React.ReactNode;
}

export const AlertTitle: React.FC<AlertTitleProps> = ({ children }) => {
  return <span className="font-medium">{children}</span>;
};

interface AlertDescriptionProps {
  children: React.ReactNode;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  children,
}) => {
  return <span className="ml-2">{children}</span>;
};

// Add type declaration for SpeechRecognition
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "default",
  className,
  children,
  ...props
}) => {
  const buttonClass = [
    "px-4 py-2 rounded-md focus:outline-none",
    variant === "default" ? "bg-blue-500 text-white hover:bg-blue-600" : "",
    variant === "destructive" ? "bg-red-500 text-white hover:bg-red-600" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children }) => {
  return <div className="p-4 border-b">{children}</div>;
};

interface CardTitleProps {
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children }) => {
  return <h2 className="text-lg font-semibold">{children}</h2>;
};

interface CardContentProps {
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ children }) => {
  return <div className="p-4">{children}</div>;
};

type props = {
  setUserTranscript: (s: string) => void;
};

export default function SpeechToText(props: props) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showEndFeedback, setShowEndFeedback] = useState(false);
  const recognitionRef = useRef<SpeechRecognition>();
  const silenceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
        props.setUserTranscript(finalTranscript + interimTranscript);

        console.log(event.results);

        resetSilenceTimeout();
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setShowEndFeedback(true);
        setTimeout(() => setShowEndFeedback(false), 3000);
      };
    } else {
      console.error("Speech recognition not supported in this browser");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 2000) as unknown as number;
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    } else {
      setTranscript("");
      if (recognitionRef.current) {
        console.log(recognitionRef.current);
        recognitionRef.current.start();
        setIsListening(true);
        resetSilenceTimeout();
      }
    }
  };

  return (
    <Button
      onClick={toggleListening}
      variant={isListening ? "destructive" : "default"}
      className="flex items-center"
    >
      {isListening ? (
        <>
          <MicOff className="h-4 w-4" />
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
