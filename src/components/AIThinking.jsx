export default function AIThinking({ visible }) {
  return (
    <div className={`ai-thinking${visible ? ' visible' : ''}`}>
      <div className="think-dot" />
      <div className="think-dot" />
      <div className="think-dot" />
      <span>AI is thinking…</span>
    </div>
  );
}
