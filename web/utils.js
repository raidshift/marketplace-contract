function shortenString(str, by, start, sep) {
    if (!by) { by = 5 }
    if (!start) { start = 0 }
    if (!sep) { sep = "..." }
    let short = str;
    return short.substr(start, by) + sep + short.substr(short.length - by, short.length);
}