import Markdown from "@/components/Markdown";
import Box from "@/components/ui/Box";
import Heading from "@/components/ui/Heading";
import type { FC } from "react";

type AnnouncementsProps = {
  announcements: string[];
};

const Announcements: FC<AnnouncementsProps> = ({ announcements }) => {
  return (
    <Box>
      <Heading level={3}>Ilmoitukset</Heading>

      {announcements.map((a, i) => {
        return (
          <Box key={i}>
            <Markdown>{a}</Markdown>
          </Box>
        );
      })}
    </Box>
  );
};

export default Announcements;
