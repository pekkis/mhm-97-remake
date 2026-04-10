import type { FC } from "react";
import Markdown from "react-markdown";

type AnnouncementsProps = {
  announcements: string[];
};

const Announcements: FC<AnnouncementsProps> = ({ announcements }) => {
  return (
    <div>
      <h2>Ilmoitukset</h2>

      {announcements.map((a, i) => {
        return (
          <div key={i}>
            <Markdown>{a}</Markdown>
          </div>
        );
      })}
    </div>
  );
};

export default Announcements;
