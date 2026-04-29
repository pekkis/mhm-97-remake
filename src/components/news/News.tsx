import Markdown from "@/components/Markdown";
import type { FC } from "react";

type NewsProps = {
  news: string[];
  manager?: unknown;
};

const News: FC<NewsProps> = ({ news }) => {
  return (
    <div>
      {news.map((n, i) => {
        return (
          <div key={i}>
            <Markdown>{n}</Markdown>
          </div>
        );
      })}
    </div>
  );
};

export default News;
