import type { StoryDefault, Story } from "@ladle/react";
import { Button } from "./Button";

export default {
  title: "Button",
} satisfies StoryDefault;

export const Default: Story = () => (
  <>
    <p>
      <Button>Hip hurraa sanoi peksu?</Button>
      <Button secondary>Hip hurraa sanoi peksu?</Button>
    </p>
    <p>
      <Button disabled>Hip hurraa sanoi peksu</Button>
      <Button secondary disabled>
        Hip hurraa sanoi peksu
      </Button>
    </p>
  </>
);

export const Disabled: Story = () => <Button disabled>Disabloitu nappi</Button>;

export const Secondary: Story = () => (
  <Button secondary>Olen toissijainen...</Button>
);

export const Terse: Story = () => <Button terse>Terse nappula</Button>;

export const Block: Story = () => <Button block>Hip hurraa sanoi peksu</Button>;
