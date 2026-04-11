import { Link } from "react-router-dom";
import Calendar from "../ui/Calendar";
import * as styles from "./Current.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppSelector } from "@/config/redux";

const Current = () => {
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
  const teams = useAppSelector((state) => state.game.teams);
  const invitations = useAppSelector((state) =>
    state.invitation.invitations.filter(
      (i) => i.manager === state.manager.active,
    ),
  );

  const team = teams[manager.team!];

  return (
    <div className={styles.current}>
      {invitations.filter((i) => !i.participate).length > 0 && (
        <div className={styles.currentEntry}>
          <FontAwesomeIcon icon={["fas", "exclamation-circle"]} />
          Pöydälläsi odottaa{" "}
          <Link to="/kutsut">avaamattomia kutsuja joulutauon turnauksiin.</Link>
        </div>
      )}

      <Calendar
        when={(entry, c) => {
          const nextTurn = c[entry.round + 1];
          return entry.transferMarket && !nextTurn.transferMarket;
        }}
      >
        <div className={styles.currentEntry}>
          <FontAwesomeIcon icon={["fas", "exclamation-circle"]} /> Nyt on
          viimeinen tilaisuutemme{" "}
          <Link to="/pelaajamarkkinat">ostaa pelaajia</Link>, sillä siirtoaika
          umpeutuu seuraavan ottelun jälkeen.
        </div>
      </Calendar>

      <Calendar when={(e) => e.crisisMeeting && team.morale <= -3}>
        <div className={styles.currentEntry}>
          <FontAwesomeIcon icon={["fas", "exclamation-circle"]} /> Joukkueen
          moraali on huono. <Link to="/kriisipalaveri">Kriisipalaveri</Link>{" "}
          auttaisi.
        </div>
      </Calendar>
    </div>
  );
};

export default Current;
