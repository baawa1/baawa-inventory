"use client";

import { useEffect, useState } from "react";
import {
  PasswordPolicy,
  PasswordStrengthResult,
} from "@/lib/utils/password-policy";
import { Check, X, AlertCircle } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange?: (
    isValid: boolean,
    result: PasswordStrengthResult
  ) => void;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  onValidationChange,
  className = "",
}: PasswordStrengthIndicatorProps) {
  const [result, setResult] = useState<PasswordStrengthResult | null>(null);

  useEffect(() => {
    if (password) {
      const validationResult = PasswordPolicy.validatePassword(password);
      setResult(validationResult);
      onValidationChange?.(validationResult.isValid, validationResult);
    } else {
      setResult(null);
      onValidationChange?.(false, {} as PasswordStrengthResult);
    }
  }, [password, onValidationChange]);

  if (!password || !result) {
    return null;
  }

  const getStrengthColor = (strength: PasswordStrengthResult["strength"]) => {
    switch (strength) {
      case "very-weak":
        return "bg-red-500";
      case "weak":
        return "bg-red-400";
      case "fair":
        return "bg-yellow-500";
      case "good":
        return "bg-blue-500";
      case "strong":
        return "bg-green-500";
      case "very-strong":
        return "bg-green-600";
      default:
        return "bg-gray-300";
    }
  };

  const getStrengthText = (strength: PasswordStrengthResult["strength"]) => {
    switch (strength) {
      case "very-weak":
        return "Very Weak";
      case "weak":
        return "Weak";
      case "fair":
        return "Fair";
      case "good":
        return "Good";
      case "strong":
        return "Strong";
      case "very-strong":
        return "Very Strong";
      default:
        return "Unknown";
    }
  };

  const getStrengthTextColor = (
    strength: PasswordStrengthResult["strength"]
  ) => {
    switch (strength) {
      case "very-weak":
      case "weak":
        return "text-red-600";
      case "fair":
        return "text-yellow-600";
      case "good":
        return "text-blue-600";
      case "strong":
      case "very-strong":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Password Strength
          </span>
          <span
            className={`text-sm font-medium ${getStrengthTextColor(result.strength)}`}
          >
            {getStrengthText(result.strength)} ({result.score}/100)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(result.strength)}`}
            style={{ width: `${result.score}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Requirements</span>
        <div className="grid grid-cols-1 gap-1 text-sm">
          <RequirementItem
            met={result.requirements.length}
            text="Minimum length (12 characters)"
          />
          <RequirementItem
            met={result.requirements.uppercase}
            text="At least one uppercase letter"
          />
          <RequirementItem
            met={result.requirements.lowercase}
            text="At least one lowercase letter"
          />
          <RequirementItem
            met={result.requirements.numbers}
            text="At least one number"
          />
          <RequirementItem
            met={result.requirements.specialChars}
            text="At least one special character"
          />
          <RequirementItem
            met={result.requirements.noForbiddenPatterns}
            text="No common patterns or words"
          />
          <RequirementItem
            met={result.requirements.noCommonWords}
            text="No company-specific terms"
          />
        </div>
      </div>

      {/* Feedback */}
      {result.feedback.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Suggestions</span>
          <div className="space-y-1">
            {result.feedback.map((feedback, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-red-600"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{feedback}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Status */}
      <div
        className={`flex items-center gap-2 text-sm font-medium ${
          result.isValid ? "text-green-600" : "text-red-600"
        }`}
      >
        {result.isValid ? (
          <>
            <Check className="h-4 w-4" />
            <span>Password meets all requirements</span>
          </>
        ) : (
          <>
            <X className="h-4 w-4" />
            <span>Password does not meet requirements</span>
          </>
        )}
      </div>
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div
      className={`flex items-center gap-2 ${met ? "text-green-600" : "text-red-600"}`}
    >
      {met ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      <span>{text}</span>
    </div>
  );
}
