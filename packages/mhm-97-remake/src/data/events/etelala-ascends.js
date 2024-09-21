import { Map, List } from "immutable";
import { call, select } from "redux-saga/effects";
import { addEvent } from "../../sagas/event";
import { managerHasService } from "../selectors";
import { cinteger } from "../../services/random";
import { incrementServiceBasePrice } from "../../sagas/game";

/*
sat74:
PRINT "Etel„l„ nostaa vakuutuksensa l„ht”hintoja!"
hinta = hinta + CINT(100 * RND) + 50
IF veikko = 1 THEN PRINT "Johtokunta l„hett„„ yhti”lle vihaisen nootin!"
RETURN
*/

const eventId = "etelalaAscends";

const event = {
  type: "manager",

  create: function*(data) {
    const { manager } = data;

    const amount = cinteger(0, 100) + 50;

    const hasInsurance = yield select(managerHasService(manager, "insurance"));

    yield call(
      addEvent,
      Map({
        eventId,
        manager,
        amount,
        hasInsurance,
        resolved: true
      })
    );
    return;
  },

  render: data => {
    let t = List.of(`Etelälä nostaa vakuutuksensa lähtöhintoja!`);

    if (data.get("hasInsurance")) {
      t = t.push(`Johtokunta lähettää yhtiölle vihaisen nootin!`);
    }

    return t;
  },

  process: function*(data) {
    const amount = data.get("amount");
    yield call(incrementServiceBasePrice, "insurance", amount);
  }
};

export default event;
