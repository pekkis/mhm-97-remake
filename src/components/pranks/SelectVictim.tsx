import type { FC } from "react";
import Button from "@/components/form/Button";
import ButtonContainer from "@/components/ui/ButtonContainer";
import type { Team } from "@/state/game";
import type { Manager } from "@/state/manager";
import type { Competition } from "@/types/competitions";

type SelectVictimProps = {
  competition: Competition;
  manager: Manager;
  selectVictim: (teamId: number) => void;
  teams: Team[];
  cancel: (...args: any[]) => void;
  prank?: unknown;
};

const SelectVictim: FC<SelectVictimProps> = ({
  competition,
  manager,
  selectVictim,
  teams,
  cancel
}) => {
  return (
    <div>
      <h3>Valitse uhrisi</h3>
      <ButtonContainer>
        <Button secondary block onClick={cancel}>
          Peruuta jäynä
        </Button>

        {competition.teams
          .filter((teamId) => teamId !== manager.team)
          .map((teamId) => {
            return (
              <Button key={teamId} block onClick={() => selectVictim(teamId)}>
                {teams[teamId].name}
              </Button>
            );
          })}
      </ButtonContainer>
    </div>
  );
};

export default SelectVictim;
