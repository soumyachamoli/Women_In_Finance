(function (root) {
  function sip(monthly, annualRate, years) {
    var months = Math.round(years * 12);
    var r = annualRate / 12 / 100;
    var total = r === 0 ? monthly * months : monthly * (Math.pow(1 + r, months) - 1) / r * (1 + r);
    var invested = monthly * months;
    return { invested: Math.round(invested), returns: Math.round(total - invested), total: Math.round(total) };
  }

  function emi(principal, annualRate, months) {
    var r = annualRate / 12 / 100;
    var monthly;
    if (r === 0) {
      monthly = principal / months;
    } else {
      var growth = Math.pow(1 + r, months);
      monthly = principal * r * growth / (growth - 1);
    }
    var total = monthly * months;
    return { emi: Math.round(monthly), interest: Math.round(total - principal), total: Math.round(total) };
  }

  var api = { sip: sip, emi: emi };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Calc = api;
})(this);
