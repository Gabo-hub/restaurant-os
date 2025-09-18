import React, { useId } from "react";
import PropTypes from "prop-types";
import { Tooltip } from "react-tooltip";

export default function MoneyTip({ exchangeRates }) {

    const tooltipId = useId();
    const base = Array.isArray(exchangeRates) ? exchangeRates : [];
    const first = base[0];
    const conversions = base[1] && typeof base[1] === 'object' ? base[1] : {};

    const rawAmount = typeof first === 'number' ? first : (first?.amount ?? 0);
    const mainAmount = Number.isFinite(rawAmount) ? rawAmount.toFixed(2) : '0.00';
    const namesExchanges = Object.keys(conversions);
    const valuesExchanges = Object.values(conversions);

    return (
        <>
            <span data-tooltip-id={tooltipId} className="relative inline-block cursor-pointer">
                {`$${mainAmount}`}
            </span>
            <Tooltip id={tooltipId} effect="solid" className="z-50 w-40">
                {namesExchanges.map((name, index) => {
                    return (
                        <div key={name}>
                            {name}: {valuesExchanges[index]}
                        </div>
                    )
                })}
            </Tooltip>
        </>
    );
}

MoneyTip.propTypes = {
    exchangeRates: PropTypes.array.isRequired,
};

MoneyTip.displayName = "MoneyTip";