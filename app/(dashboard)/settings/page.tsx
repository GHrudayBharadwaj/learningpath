"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Check, User, Sparkles, Bell, Shield, Key, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Demo Student",
    email: "demo@studyplanner.ai",
    preferredAiProvider: "gemini",
    preferredDifficulty: "intermediate",
    preferredLength: "medium",
    preferredPurpose: "exam",
    timezone: "UTC",
    emailNotifications: true,
  });

  const [openAiKey, setOpenAiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => {
        if (data.user) setProfile(data.user);
      })
      .catch(console.error);

    if (typeof window !== "undefined") {
      setOpenAiKey(localStorage.getItem("ai_study_planner_openai_key") || "");
      setGeminiKey(localStorage.getItem("ai_study_planner_gemini_key") || "");
    }
  }, []);

  const handleTestApiKey = async (provider: "openai" | "gemini") => {
    const key = provider === "openai" ? openAiKey : geminiKey;
    if (!key || key.trim() === "") {
      setTestResult({ provider, success: false, message: `Please enter a ${provider === "gemini" ? "Google Gemini" : "OpenAI"} API key first` });
      return;
    }

    setTestingProvider(provider);
    setTestResult(null);

    try {
      const res = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: key.trim() }),
      });
      const data = await res.json();
      setTestResult({ provider, success: data.success, message: data.message || data.error });
      if (data.success && typeof window !== "undefined") {
        if (provider === "openai") localStorage.setItem("ai_study_planner_openai_key", key.trim());
        if (provider === "gemini") localStorage.setItem("ai_study_planner_gemini_key", key.trim());
      }
    } catch (err: any) {
      setTestResult({ provider, success: false, message: err.message });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    setSaveSuccess(false);

    if (typeof window !== "undefined") {
      if (openAiKey) localStorage.setItem("ai_study_planner_openai_key", openAiKey.trim());
      if (geminiKey) localStorage.setItem("ai_study_planner_gemini_key", geminiKey.trim());
    }

    try {
      const payload: any = { ...profile };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile settings.");
      }

      setSaveSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <Settings className="h-6 w-6 text-gray-600" />
          <span>User Profile & Workspace Settings</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your personal credentials, AI model defaults, and notification preferences.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>Your name and registered student email address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Full Name</label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Email Address</label>
                <Input
                  disabled
                  value={profile.email}
                  className="bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI & Learning Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>AI Provider & Note Defaults</span>
            </CardTitle>
            <CardDescription>Configure default AI model and generation parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Preferred AI Engine</label>
                <select
                  value={profile.preferredAiProvider}
                  onChange={(e) => setProfile({ ...profile, preferredAiProvider: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
                  <option value="openai">OpenAI (GPT-4o Mini / GPT-4o)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Default Difficulty</label>
                <select
                  value={profile.preferredDifficulty}
                  onChange={(e) => setProfile({ ...profile, preferredDifficulty: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Default Note Length</label>
                <select
                  value={profile.preferredLength}
                  onChange={(e) => setProfile({ ...profile, preferredLength: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI API Keys Integration Card */}
        <Card className="border-purple-200 dark:border-purple-900/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Key className="h-4 w-4 text-purple-600" />
              <span>AI API Keys & Live Model Integration</span>
            </CardTitle>
            <CardDescription>
              Enter your Google Gemini or OpenAI API keys to generate real-time study notes and matter directly with advanced AI models.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Gemini Key */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    Google Gemini API Key
                    <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                      Recommended (Free Tier Available)
                    </span>
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Get an API key from Google AI Studio (<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">aistudio.google.com</a>).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingProvider === "gemini"}
                  onClick={() => handleTestApiKey("gemini")}
                  className="text-xs self-start sm:self-auto shrink-0"
                >
                  {testingProvider === "gemini" ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Testing...</>
                  ) : "Test Gemini Key"}
                </Button>
              </div>

              <Input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="text-xs h-9 bg-white dark:bg-gray-900 font-mono"
              />

              {testResult?.provider === "gemini" && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                  testResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* OpenAI Key */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    OpenAI API Key
                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                      GPT-4o & GPT-4o Mini
                    </span>
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Get an API key from OpenAI Platform (<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">platform.openai.com</a>).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingProvider === "openai"}
                  onClick={() => handleTestApiKey("openai")}
                  className="text-xs self-start sm:self-auto shrink-0"
                >
                  {testingProvider === "openai" ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Testing...</>
                  ) : "Test OpenAI Key"}
                </Button>
              </div>

              <Input
                type="password"
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="text-xs h-9 bg-white dark:bg-gray-900 font-mono"
              />

              {testResult?.provider === "openai" && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                  testResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Bell className="h-4 w-4 text-orange-600" />
              <span>Scheduled Reminders & Notifications</span>
            </CardTitle>
            <CardDescription>Automated study schedule delivery via Vercel Cron & Resend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Email Study Reminders</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Receive upcoming study session alerts and daily morning summaries.</p>
              </div>
              <input
                type="checkbox"
                checked={profile.emailNotifications}
                onChange={(e) => setProfile({ ...profile, emailNotifications: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Change Password</span>
            </CardTitle>
            <CardDescription>Leave blank if you do not wish to update your password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">New Password (min 6 chars)</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
            {feedback}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <Check className="h-4 w-4 mr-1" /> Settings and API keys saved successfully!
            </span>
          ) : <span />}

          <Button type="submit" size="sm" disabled={isSaving} className="text-xs px-6">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            <span>{isSaving ? "Saving Settings..." : "Save Changes"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
