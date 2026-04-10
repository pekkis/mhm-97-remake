import React, { type ReactElement } from "react";
import styled from "styled-components";
import Tab from "./Tab";

const TabsList = styled.ul`
  background-color: rgba(33, 33, 33, 0.3);
  padding: 1em;
  display: flex;
  flex-basis: 100%;
  flex-wrap: wrap;
  align-items: center;
  align-content: stretch;

  list-style-position: inside;
  list-style-type: none;
  margin: 1em 0;
  padding: 0;
  ${Tab} + ${Tab} {
    margin-left: 1em;
  }
`;

const TabContent = styled.div`
  padding: 0;
`;

type TabsProps = {
  className?: string;
  children: ReactElement[];
  selected: number;
  onSelect: (index: number) => void;
};

const Tabs = ({ className, children, selected, onSelect }: TabsProps) => {
  const childrenArray = React.Children.toArray(children) as ReactElement<any>[];

  return (
    <div className={className}>
      <TabsList>
        {childrenArray.map((child, key) =>
          React.cloneElement(child, {
            isSelected: key === selected,
            onSelect: () => onSelect(key),
          } as any),
        )}
      </TabsList>

      <TabContent>{(childrenArray[selected].props as any).children}</TabContent>
    </div>
  );
};

export default styled(Tabs)`
  background-color: rgba(255, 255, 255);
`;
