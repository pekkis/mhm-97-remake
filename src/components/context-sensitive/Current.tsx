import { Link } from "react-router-dom";
import Calendar from "../ui/Calendar";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppSelector } from "@/config/redux";

const CurrentEntry = styled.div`
  padding: 0.5em;
  border: 1px dotted rgb(225, 225, 225);
`;

type CurrentProps = {
  className?: string;
};

const Current = ({ className }: CurrentProps) => {
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
    <div className={className}>
      {invitations.filter((i) => !i.participate).length > 0 && (
        <CurrentEntry>
          <FontAwesomeIcon icon={["fas", "exclamation-circle"]} />
          Pöydälläsi odottaa{" "}
          <Link to="/kutsut">avaamattomia kutsuja joulutauon turnauksiin.</Link>
        </CurrentEntry>
      )}

      <Calendar
        when={(entry, c) => {
          const nextTurn = c[entry.round + 1];
          return entry.transferMarket && !nextTurn.transferMarket;
        }}
      >
        <CurrentEntry>
          <FontAwesomeIcon icon={["fas", "exclamation-circle"]} /> Nyt on
          viimeinen tilaisuutemme{" "}
          <Link to="/pelaajamarkkinat">ostaa pelaajia</Link>, sillä siirtoaika
          umpeutuu seuraavan ottelun jälkeen.
        </CurrentEntry>
      </Calendar>

      <Calendar when={(e) => e.crisisMeeting && team.morale <= -3}>
        <CurrentEntry>
          <FontAwesomeIcon icon={["fas", "exclamation-circle"]} /> Joukkueen
          moraali on huono. <Link to="/kriisipalaveri">Kriisipalaveri</Link>{" "}
          auttaisi.
        </CurrentEntry>
      </Calendar>
    </div>
  );
};

export default styled(Current)`
  margin-bottom: 1em;
`;
