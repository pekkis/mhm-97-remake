import type { FC } from "react";
import Stack from "@/components/ui/Stack";
import Button from "@/components/ui/Button";
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
      <p>
        <strong>Jäynä: </strong>
        {prankInfo.name}
      </p>

      <p>
        <strong>Uhri: </strong>
        {teams[prank.victim]?.name}
      </p>

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
