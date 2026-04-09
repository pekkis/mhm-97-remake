import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./ManagerInfo";
import Box from "./styled-system/Box";
import tournamentList from "../data/tournaments";
import Markdown from "react-markdown";
import Button from "./form/Button";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { acceptInvitation } from "../ducks/invitation";

const Invitations = () => {
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
  const invitations = useAppSelector((state) =>
    state.invitation.invitations.filter(
      (i) => i.manager === state.manager.active,
    ),
  );
  const dispatch = useAppDispatch();

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
        <h2>Turnauskutsut</h2>

        {invitations.map((i, index) => {
          const t = tournamentList[i.tournament];
          return (
            <div key={index}>
              <h3>{t.name}</h3>

              <Markdown>{t.description(t.award)}</Markdown>

              <Button
                block
                onClick={() => dispatch(acceptInvitation(manager.id, i.id))}
                disabled={i.participate}
              >
                Hyväksy turnauskutsu
              </Button>
            </div>
          );
        })}
      </Box>
    </HeaderedPage>
  );
};

export default Invitations;
