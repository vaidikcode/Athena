import { buildToolRegistry } from "@/lib/tools/registry";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopBar } from "@/components/layout/TopBar";

export default function ToolsPage() {
  const tools = buildToolRegistry().map((t) => ({
    name: t.name,
    description: t.description,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Tools" subtitle="What the assistant can call on your behalf" />
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="text-sm text-slate-500">
            Ask in the chat in plain language—you never need to type tool names. This page is only a reference.
          </p>
          <div className="grid gap-3">
            {tools.map((t) => (
              <Card key={t.name} className="border-slate-200">
                <CardHeader className="py-3">
                  <CardTitle className="font-mono text-sm text-emerald-800">{t.name}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-slate-600">{t.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
