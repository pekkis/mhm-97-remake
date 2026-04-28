import { Link } from "react-router-dom";
import { useSelector } from "@xstate/store/react";
import Calendar from "./ui/Calendar";
import Cluster from "./ui/Cluster";
import { getEffective } from "@/services/effects";
import { CRISIS_MORALE_MAX } from "@/data/constants";
import Button from "./form/Button";
import {
  GameMachineContext,
  useGameContext
} from "@/context/game-machine-context";
import { AppMachineContext } from "@/context/app-machine-context";
import { uiStore, type ThemePreference } from "@/stores/ui";
import { activeManager } from "@/machines/selectors";

const themeOptions: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "Järjestelmä" },
  { value: "light", label: "Vaalea" },
  { value: "dark", label: "Tumma" }
];

const ActionMenu = () => {
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const appActor = AppMachineContext.useActorRef();
  const team = getEffective(teams[manager.team!]);
  const theme = useSelector(uiStore, (s) => s.context.theme);

  const canSave = GameMachineContext.useSelector((state) =>
    state.matches({ in_game: { executing_phases: "action" } })
  );

  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link onClick={() => uiStore.send({ type: "closeMenu" })} to="/">
              Päävalikko
            </Link>
          </li>

          {team.morale <= CRISIS_MORALE_MAX && (
            <Calendar when={(c) => c.crisisMeeting}>
              <li>
                <Link
                  onClick={() => uiStore.send({ type: "closeMenu" })}
                  to="/kriisipalaveri"
                >
                  Kriisipalaveri
                </Link>
              </li>
            </Calendar>
          )}
          <Calendar when={(c) => c.transferMarket}>
            <li>
              <Link
                onClick={() => uiStore.send({ type: "closeMenu" })}
                to="/pelaajamarkkinat"
              >
                Pelaajamarkkinat
              </Link>
            </li>
          </Calendar>
          <li>
            <Link
              onClick={() => uiStore.send({ type: "closeMenu" })}
              to="/sarjataulukot"
            >
              Sarjataulukot
            </Link>
          </li>

          <li>
            <Link
              onClick={() => uiStore.send({ type: "closeMenu" })}
              to="/areena"
            >
              Areena
            </Link>
          </li>

          <li>
            <Link
              onClick={() => uiStore.send({ type: "closeMenu" })}
              to="/erikoistoimenpiteet"
            >
              Erikoistoimenpiteet
            </Link>
          </li>

          <Calendar when={(c) => c.pranks}>
            <li>
              <Link
                onClick={() => uiStore.send({ type: "closeMenu" })}
                to="/jaynat"
              >
                Jäynät
              </Link>
            </li>
          </Calendar>

          <li>
            <Link
              onClick={() => uiStore.send({ type: "closeMenu" })}
              to="/tilastot"
            >
              Tilastot
            </Link>
          </li>

          <Calendar
            when={(e, _c, competitions) => {
              return e.gamedays.includes("phl") && competitions.phl.phase === 0;
            }}
          >
            <li>
              <Link
                onClick={() => uiStore.send({ type: "closeMenu" })}
                to="/veikkaus"
              >
                Veikkaus
              </Link>
            </li>
          </Calendar>

          <li>
            <Link
              onClick={() => uiStore.send({ type: "closeMenu" })}
              to="/debug"
            >
              Devausmenukka
            </Link>
          </li>
        </ul>
      </nav>
      <Button
        block
        disabled={!canSave}
        type="button"
        onClick={() => {
          appActor.send({ type: "SAVE_GAME" });
          uiStore.send({ type: "closeMenu" });
        }}
      >
        Tallenna
      </Button>

      <Button
        block
        type="button"
        onClick={() => {
          appActor.send({ type: "QUIT" });
          uiStore.send({ type: "closeMenu" });
        }}
      >
        Lopeta!
      </Button>

      <Cluster gap="xs" justify="space-between">
        {themeOptions.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            terse
            secondary={theme !== opt.value}
            onClick={() => uiStore.send({ type: "setTheme", theme: opt.value })}
          >
            {opt.label}
          </Button>
        ))}
      </Cluster>
    </div>
  );
};

export default ActionMenu;
