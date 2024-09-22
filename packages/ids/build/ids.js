import { jsx as i } from "react/jsx-runtime";
import * as t from "@stylexjs/stylex";
import { colors as r } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes as a } from "@stylexjs/open-props/lib/sizes.stylex";
import { borders as e } from "@stylexjs/open-props/lib/borders.stylex";
const l = t.create({
  button: {
    borderRadius: `${e.radius3}`,
    borderStyle: "solid",
    borderWidth: e.size1,
    borderColor: `light-dark(${r.gray9}, ${r.gray8})`,
    backgroundColor: `light-dark(${r.gray5}, ${r.gray7})`,
    paddingBlock: a.spacing2,
    paddingInline: a.spacing3,
    cursor: "pointer",
    color: `light-dark(${r.gray12}, ${r.gray3})`
  },
  block: {
    display: "block",
    width: "100%"
  }
}), k = ({
  block: o = !1,
  secondary: s = !1,
  terse: d = !1,
  children: n,
  ...g
}) => /* @__PURE__ */ i("button", { ...g, ...t.props(l.button, o && l.block), children: n }), c = t.create({
  input: {
    backgroundColor: `light-dark(${r.gray5}, ${r.gray7})`,
    color: `light-dark(${r.gray12}, ${r.gray3})`,
    borderRadius: e.radius3,
    borderStyle: "solid",
    borderWidth: `${e.size1}`,
    borderColor: `light-dark(${r.gray9}, ${r.gray8})`,
    paddingBlock: a.spacing2,
    paddingInline: a.spacing3,
    cursor: "pointer"
  }
}), h = ({ ...o }) => /* @__PURE__ */ i("input", { ...o, ...t.props(c.input) }), p = t.create({
  select: {
    backgroundColor: `light-dark(${r.gray5}, ${r.gray7})`,
    color: `light-dark(${r.gray12}, ${r.gray3})`,
    borderRadius: e.radius3,
    borderStyle: "solid",
    borderWidth: `${e.size1}`,
    borderColor: `light-dark(${r.gray9}, ${r.gray8})`,
    paddingBlock: a.spacing2,
    paddingInline: a.spacing3,
    cursor: "pointer"
  }
}), m = ({ children: o, ...s }) => /* @__PURE__ */ i("select", { ...s, ...t.props(p.select), children: o }), f = ({ children: o, style: s, ...d }) => (console.log("BOX PROPS", d), /* @__PURE__ */ i("div", { ...t.props(s), children: o }));
export {
  f as Box,
  k as Button,
  h as Input,
  m as Select
};
