import type { FC } from "react";
import ButtonContainer from "../ui/ButtonContainer";
import Button from "../form/Button";
import pranks from "../../data/pranks";
import type { Team } from "../../ducks/game";
import type { Manager } from "../../ducks/manager";

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

      <ButtonContainer>
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
      </ButtonContainer>
    </div>
  );
};

export default ConfirmPrank;
