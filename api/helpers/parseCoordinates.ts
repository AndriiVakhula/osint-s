function dmsToDecimal(
    degrees: number,
    minutes: number,
    seconds: number,
    hemisphere: string,
): number {
    const sign = /(S|W)/i.test(hemisphere) ? -1 : 1;
    const dec = Math.abs(degrees) + minutes / 60 + seconds / 3600;
    return dec * sign;
}

function parseSingleCoordinatePart(input: string): number {
    let coord = input.trim().toUpperCase();

    let hemisphere = "";
    const startDirMatch = coord.match(/^([NSEW])/);
    const endDirMatch = coord.match(/([NSEW])$/);

    if (startDirMatch) {
        hemisphere = startDirMatch[1];
        coord = coord.replace(/^([NSEW])/, "").trim();
    }
    if (endDirMatch) {
        hemisphere = endDirMatch[1];
        coord = coord.replace(/([NSEW])$/, "").trim();
    }

    coord = coord
        .replace(/[°′'\"]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const parts = coord.split(" ");
    if (parts.length === 1 && /^-?\d+(\.\d+)?$/.test(parts[0])) {
        const value = parseFloat(parts[0]);
        return /(S|W)/i.test(hemisphere) ? -value : value;
    }

    const deg = parseFloat(parts[0]) || 0;
    const min = parseFloat(parts[1]) || 0;
    const sec = parseFloat(parts[2]) || 0;

    return dmsToDecimal(deg, min, sec, hemisphere);
}

export function parseCoordinates(input: string): Array<number> {
    let str = input.trim();

    str = str.replace(/[,;]+/g, " ").replace(/\s+/g, " ").trim();

    const hasDirectionLetters = /[NSEW]/i.test(str);

    if (!hasDirectionLetters) {
        const split = str.split(/\s+/); // розбиваємо по пробілу

        if (split.length < 2) {
            return [];
        }
        const lat = parseFloat(split[0]);
        const lng = parseFloat(split[1]);

        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            throw new Error("Invalid latitude/longitude");
        }

        return [lng, lat];
    } else {
        const coordRegex = /([NSEW]?[^NSEW]+[NSEW]?)/gi;
        const matches = str.match(coordRegex);

        if (!matches || matches.length < 2) {
            throw new Error("Invalid latitude/longitude");
        }

        const part1 = matches[0].trim();
        const part2 = matches[1].trim();

        let latCandidate = parseSingleCoordinatePart(part1);
        let lngCandidate = parseSingleCoordinatePart(part2);

        const part1Dir = (part1.match(/[NSEW]/gi) || []).join("");
        const part2Dir = (part2.match(/[NSEW]/gi) || []).join("");

        if (/[EW]/i.test(part1Dir) && !/[NS]/i.test(part1Dir)) {
            [latCandidate, lngCandidate] = [lngCandidate, latCandidate];
        }
        if (/[NS]/i.test(part2Dir) && !/[EW]/i.test(part2Dir)) {
            [latCandidate, lngCandidate] = [lngCandidate, latCandidate];
        }

        if (Math.abs(latCandidate) > 90 && Math.abs(lngCandidate) <= 90) {
            [latCandidate, lngCandidate] = [lngCandidate, latCandidate];
        }

        if (Math.abs(latCandidate) > 90 || Math.abs(lngCandidate) > 180) {
            throw new Error("Invalid latitude/longitude");
        }

        return [lngCandidate, latCandidate];
    }
}
