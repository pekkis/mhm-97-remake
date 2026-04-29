import Markdown from "@/components/Markdown";
import type { FC } from "react";

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
