import type { FC } from "react";
import Button from "@/components/form/Button";
import ButtonContainer from "@/components/ui/ButtonContainer";
import pranks from "@/game/pranks";
import { currency as c } from "@/services/format";
import type { Manager } from "@/ducks/manager";
import { entries } from "remeda";

type SelectTypeProps = {
  manager: Manager;
  selectType: (type: string) => void;
  competition: string;
  enabled: boolean;
  cancel?: (id: string) => void;
};

const SelectType: FC<SelectTypeProps> = ({
  manager,
  selectType,
  competition,
  enabled
}) => {
  return (
    <div>
      <ButtonContainer>
        {entries(pranks).map(([key, prank]) => {
          const price = prank.price(competition);

          return (
            <Button
              disabled={!enabled || price > manager.balance}
              block
              key={key}
              onClick={() => {
                selectType(key);
              }}
            >
              <div>{prank.name}</div>
              <div>
                <small>{c(price)}</small>
              </div>
            </Button>
          );
        })}
      </ButtonContainer>
    </div>
  );
};

export default SelectType;
