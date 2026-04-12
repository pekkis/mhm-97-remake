import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";

import SelectVictim from "./pranks/SelectVictim";
import SelectType from "./pranks/SelectType";
import ConfirmPrank from "./pranks/ConfirmPrank";
import Box from "./styled-system/Box";
import Calendar from "./ui/Calendar";

import difficultyLevels from "../data/difficulty-levels";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { orderPrank } from "../ducks/prank";
import { useMachine } from "@xstate/react";
import { prankSelectionMachine } from "../machines/prankSelection";
import { activeManager } from "@/selectors";

const Pranks = () => {
  const manager = useAppSelector(activeManager);
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector((state) => state.game.competitions);
  const [state, send] = useMachine(prankSelectionMachine);
  const dispatch = useAppDispatch();

  const phl = competitions.phl;
  const division = competitions.division;

  const difficultyLevel = difficultyLevels[manager.difficulty];

  const canDo = difficultyLevel.pranksPerSeason > manager.pranksExecuted;

  const targetCompetition = phl.teams.includes(manager.team!) ? phl : division;

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
        <Calendar
          when={(c) => c.pranks}
          fallback={<p>Jäynät on tältä kaudelta jäynäytetty.</p>}
        >
          <h2>Jäynät</h2>

          {!canDo && (
            <p>
              Olet jo jäynäyttänyt {manager.pranksExecuted} kertaa tällä
              kaudella. Nähdään ensi vuonna!
            </p>
          )}

          {state.matches("idle") && (
            <SelectType
              manager={manager}
              enabled={canDo}
              competition={targetCompetition.name}
              selectType={(id: string) =>
                send({ type: "SELECT_TYPE", prankType: id })
              }
              cancel={() => send({ type: "CANCEL" })}
            />
          )}

          {state.matches("typeSelected") && (
            <SelectVictim
              manager={manager}
              prank={state.context}
              competition={targetCompetition}
              teams={teams}
              selectVictim={(id: number) =>
                send({ type: "SELECT_VICTIM", victim: id })
              }
              cancel={() => send({ type: "CANCEL" })}
            />
          )}

          {state.matches("victimSelected") && (
            <ConfirmPrank
              manager={manager}
              prank={{
                type: state.context.type!,
                victim: state.context.victim!
              }}
              execute={(m: string, t: string, v: number) => {
                dispatch(orderPrank({ manager: m, type: t, victim: v }));
                send({ type: "ORDER" });
              }}
              teams={teams}
              cancel={() => send({ type: "CANCEL" })}
            />
          )}
        </Calendar>
      </Box>
    </HeaderedPage>
  );
};

export default Pranks;
