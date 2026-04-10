import type { FC } from "react";
import Markdown from "react-markdown";

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
