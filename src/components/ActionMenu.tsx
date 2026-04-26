import { Link } from "react-router-dom";
import Calendar from "./ui/Calendar";
import { getEffective } from "@/services/effects";
import { CRISIS_MORALE_MAX } from "@/data/constants";
import Button from "./form/Button";
import { useAppDispatch } from "@/config/redux";
import { useGameContext } from "@/context/game-machine-context";
import { uiStore } from "@/stores/ui";
import { saveGame, quitToMainMenu } from "@/ducks/meta";
import { activeManager } from "@/machines/selectors";

const ActionMenu = () => {
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const turn = useGameContext((ctx) => ctx.turn);
  const dispatch = useAppDispatch();
  const team = getEffective(teams[manager.team!]);

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
        disabled={turn.phase !== "action"}
        type="button"
        onClick={() => {
          dispatch(saveGame());
          uiStore.send({ type: "closeMenu" });
        }}
      >
        Tallenna
      </Button>

      <Button
        block
        type="button"
        onClick={() => {
          dispatch(quitToMainMenu());
          uiStore.send({ type: "closeMenu" });
        }}
      >
        Lopeta!
      </Button>
    </div>
  );
};

export default ActionMenu;
