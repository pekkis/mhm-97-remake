import type { FC } from "react";
import Stack from "@/components/ui/Stack";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import pranks from "@/game/pranks";
import type { Team } from "@/state/game";
import type { Manager } from "@/state/manager";

type ConfirmPrankProps = {
  cancel: () => void;
  manager: Manager;
  teams: Team[];
  prank: { type: string; victim: number };
  execute: (managerId: string, type: string, victim: number) => void;
};

const ConfirmPrank: FC<ConfirmPrankProps> = ({
  cancel,
  manager,
  teams,
  prank,
  execute
}) => {
  const prankInfo = pranks[prank.type];

  return (
    <div>
      <Paragraph>
        <strong>Jäynä: </strong>
        {prankInfo.name}
      </Paragraph>

      <Paragraph>
        <strong>Uhri: </strong>
        {teams[prank.victim]?.name}
      </Paragraph>

      <Stack>
        <Button
          block
          onClick={() => {
            execute(manager.id, prank.type, prank.victim);
          }}
        >
          Varmista
        </Button>

        <Button
          block
          secondary
          onClick={() => {
            cancel();
          }}
        >
          Peruuta
        </Button>
      </Stack>
    </div>
  );
};

export default ConfirmPrank;
