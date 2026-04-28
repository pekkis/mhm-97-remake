import { useState } from "react";
import type { FC } from "react";
import Tabs from "@/components/ui/Tabs";
import Tab from "@/components/ui/Tab";
import Season from "@/components/data/Season";

type TeamStatsProps = {
  stats: any;
  teams: any;
  countries: Record<string, { name: string }>;
};

const TeamStats: FC<TeamStatsProps> = ({ stats, teams, countries }) => {
  const [tab, setTab] = useState(0);

  return (
    <Tabs selected={tab} onSelect={setTab}>
      <Tab title="Mitalistit">
        <table>
          <thead>
            <tr>
              <th className="fixed">Vuosi</th>
              <th>Kultaa</th>
              <th>Hopeaa</th>
              <th>Pronssia</th>
            </tr>
          </thead>
          <tbody>
            {stats.seasons
              .map((season: any, seasonIndex: number) => {
                return (
                  <tr key={seasonIndex}>
                    <td className="fixed">
                      <Season index={seasonIndex} />
                    </td>
                    {season.medalists?.map((m: string, k: number) => (
                      <td key={k}>{teams[m]?.name}</td>
                    ))}
                  </tr>
                );
              })
              .toReversed()}
          </tbody>
        </table>
      </Tab>
      <Tab title="Runkosarjan voittaja">
        <table>
          <thead>
            <tr>
              <th>Vuosi</th>
              <th>Runkosarjan voittaja</th>
            </tr>
          </thead>
          <tbody>
            {stats.seasons
              .map((season: any, seasonIndex: number) => {
                return (
                  <tr key={seasonIndex}>
                    <td>
                      <Season index={seasonIndex} />
                    </td>
                    <td>{teams[season.presidentsTrophy]?.name}</td>
                  </tr>
                );
              })
              .toReversed()}
          </tbody>
        </table>
      </Tab>
      <Tab title="Nousijat / putoajat">
        <table>
          <thead>
            <tr>
              <th>Vuosi</th>
              <th>Nousija</th>
              <th>Putoaja</th>
            </tr>
          </thead>
          <tbody>
            {stats.seasons
              .map((season: any, seasonIndex: number) => {
                return (
                  <tr key={seasonIndex}>
                    <td>
                      <Season index={seasonIndex} />
                    </td>
                    <td>{teams[season.promoted]?.name ?? "-"}</td>
                    <td>{teams[season.relegated]?.name ?? "-"}</td>
                  </tr>
                );
              })
              .toReversed()}
          </tbody>
        </table>
      </Tab>
      <Tab title="EHL">
        <table>
          <thead>
            <tr>
              <th>Vuosi</th>
              <th>Euroopan mestari</th>
            </tr>
          </thead>
          <tbody>
            {stats.seasons
              .map((season: any, seasonIndex: number) => {
                return (
                  <tr key={seasonIndex}>
                    <td>
                      <Season index={seasonIndex} />
                    </td>
                    <td>{teams[season.ehlChampion]?.name}</td>
                  </tr>
                );
              })
              .toReversed()}
          </tbody>
        </table>
      </Tab>
      <Tab title="MM-kisat">
        <table>
          <thead>
            <tr>
              <th className="fixed">Vuosi</th>
              <th>Kultaa</th>
              <th>Hopeaa</th>
              <th>Pronssia</th>
            </tr>
          </thead>
          <tbody>
            {stats.seasons
              .map((season: any, seasonIndex: number) => {
                return (
                  <tr key={seasonIndex}>
                    <td className="fixed">
                      <Season index={seasonIndex} />
                    </td>
                    {season.worldChampionships
                      ?.slice(0, 3)
                      .map((m: string, k: number) => (
                        <td key={k}>{countries?.[m]?.name}</td>
                      ))}
                  </tr>
                );
              })
              .toReversed()}
          </tbody>
        </table>
      </Tab>
    </Tabs>
  );
};

export default TeamStats;
