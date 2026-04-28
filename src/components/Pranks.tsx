import ManagerInfo from "./ManagerInfo";
import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";

import SelectVictim from "./pranks/SelectVictim";
import SelectType from "./pranks/SelectType";
import ConfirmPrank from "./pranks/ConfirmPrank";
import Box from "./ui/Box";
import Calendar from "./ui/Calendar";

import {
  GameMachineContext,
  useGameContext
} from "@/context/game-machine-context";
import { useMachine } from "@xstate/react";
import { prankSelectionMachine } from "@/machines/prankSelection";
import { activeManager, canOrderPrank } from "@/machines/selectors";

const Pranks = () => {
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);
  const canDo = useGameContext(canOrderPrank(manager.id));
  const [state, send] = useMachine(prankSelectionMachine);
  const gameActor = GameMachineContext.useActorRef();

  const phl = competitions.phl;
  const division = competitions.division;

  const targetCompetition = phl.teams.includes(manager.team!) ? phl : division;

  return (
    <AdvancedHeaderedPage
      stickyMenu={<StickyMenu back />}
      managerInfo={<ManagerInfo details />}
    >
      <Box p="md">
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
                gameActor.send({
                  type: "ORDER_PRANK",
                  payload: { manager: m, type: t, victim: v }
                });
                send({ type: "ORDER" });
              }}
              teams={teams}
              cancel={() => send({ type: "CANCEL" })}
            />
          )}
        </Calendar>
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default Pranks;
