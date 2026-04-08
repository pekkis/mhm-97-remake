import React, { useState } from "react";

import Tabs from "../ui/Tabs";
import Tab from "../ui/Tab";
import Story from "./Story";

const TeamStats = (props) => {
  const { competitions, manager, stats, teams } = props;

  const [tab, setTab] = useState(0);

  const managersStories = stats.seasons
    .map((season) => season.stories?.[manager.id]);

  return (
    <div>
      <Tabs selected={tab} onSelect={setTab}>
        <Tab title="Kausi kaudelta">
          {managersStories
            .map((story, seasonIndex) => {
              return (
                <Story
                  key={seasonIndex}
                  season={seasonIndex}
                  story={story}
                  teams={teams}
                  competitions={competitions}
                />
              );
            })
            .toReversed()}
        </Tab>
        <Tab title="Ura numeroina">
          <div>
            {["phl", "division", "ehl"]
              .map((c) => competitions[c])
              .map((c) => {
                const stat = stats.managers?.[manager.id]?.games?.[c.id]?.["0"] ?? {
                  win: 0,
                  draw: 0,
                  loss: 0
                };

                return (
                  <div key={c.id}>
                    <h3>{c.name}</h3>

                    <table>
                      <tbody>
                        <tr>
                          <th>Otteluita</th>
                          <td>{stat.win + stat.draw + stat.loss}</td>
                        </tr>
                        <tr>
                          <th>Voittoja</th>
                          <td>{stat.win}</td>
                        </tr>
                        <tr>
                          <th>Tasapelejä</th>
                          <td>{stat.draw}</td>
                        </tr>
                        <tr>
                          <th>Tappioita</th>
                          <td>{stat.loss}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default TeamStats;
