import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import { getEffective } from "@/services/effects";
import Box from "./styled-system/Box";
import { useGameContext } from "@/context/game-machine-context";
import { values } from "remeda";

const DeveloperMenu = () => {
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);

  return (
    <HeaderedPage>
      <Header back />

      <Box p={1}>
        <h2>Devausinfo</h2>

        {values(competitions).map((c) => {
          return (
            <div key={c.id}>
              <h2>{c.name}</h2>
              <table>
                <thead>
                  <tr>
                    <th>Joukkue</th>
                    <th>O-voima</th>
                    <th>E-voima</th>
                    <th>E-moraali</th>
                    <th>E-valmius</th>
                  </tr>
                </thead>

                <tbody>
                  {c.teams
                    .toSorted((a, b) => teams[b].strength - teams[a].strength)
                    .map((t) => {
                      const team = teams[t];
                      const e = getEffective(team);

                      return (
                        <tr key={team.id}>
                          <td>{team.name}</td>
                          <td>{team.strength}</td>
                          <td>{e.strength}</td>
                          <td>{e.morale}</td>
                          <td>{e.readiness}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          );
        })}
      </Box>
    </HeaderedPage>
  );
};

export default DeveloperMenu;
