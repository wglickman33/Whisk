import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Components } from "react-markdown";

const components: Components = {
  a: ({ href, children, ...props }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        {...props}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
};

type Props = {
  children: string;
};

export function SafeMarkdown({ children }: Props) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
      {children}
    </Markdown>
  );
}
