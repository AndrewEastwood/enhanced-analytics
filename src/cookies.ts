/* eslint-disable no-var */
class Cookies {
  constructor(private defaultAttributes: Record<string, any>) {}

  private conv = {
    read(value) {
      if (value[0] === '"') {
        value = value.slice(1, -1);
      }
      return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    },
    write(value) {
      return encodeURIComponent(value).replace(
        /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
        decodeURIComponent
      );
    },
  };

  public set = (name, value, attributes: Record<string, any> = {}) => {
    if (typeof document === 'undefined') {
      return;
    }

    attributes = Object.assign({}, this.defaultAttributes, attributes);

    if (typeof attributes.expires === 'number') {
      attributes.expires = new Date(Date.now() + attributes.expires * 864e5);
    }
    if (attributes.expires) {
      attributes.expires = attributes.expires.toUTCString();
    }

    name = encodeURIComponent(name)
      .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
      .replace(/[()]/g, escape);

    var stringifiedAttributes = '';
    for (var attributeName in attributes) {
      if (!attributes[attributeName]) {
        continue;
      }

      stringifiedAttributes += '; ' + attributeName;

      if (attributes[attributeName] === true) {
        continue;
      }

      // Considers RFC 6265 section 5.2:
      // ...
      // 3.  If the remaining unparsed-attributes contains a %x3B (";")
      //     character:
      // Consume the characters of the unparsed-attributes up to,
      // not including, the first %x3B (";") character.
      // ...
      stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
    }

    return (document.cookie =
      name + '=' + this.conv.write(value) /*, name)*/ + stringifiedAttributes);
  };

  public get = (name): string | null => {
    if (typeof document === 'undefined' || !name) {
      return null;
    }

    // To prevent the for loop in the first place assign an empty array
    // in case there are no cookies at all.
    var cookies = document.cookie ? document.cookie.split('; ') : [];
    var jar = {};
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split('=');
      var value = parts.slice(1).join('=');

      try {
        var found = decodeURIComponent(parts[0]);
        jar[found] = this.conv.read(value); //, found);

        if (name === found) {
          break;
        }
      } catch (e) {}
    }

    return jar[name] ?? null;
  };

  public getAll = (): Record<string, any> => {
    if (typeof document === 'undefined') {
      return {};
    }

    // To prevent the for loop in the first place assign an empty array
    // in case there are no cookies at all.
    var cookies = document.cookie ? document.cookie.split('; ') : [];
    var jar = {};
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split('=');
      var value = parts.slice(1).join('=');

      try {
        var found = decodeURIComponent(parts[0]);
        jar[found] = this.conv.read(value); //, found);
      } catch (e) {}
    }

    return jar;
  };

  public remove = (name, attributes) => {
    this.set(
      name,
      '',
      Object.assign({}, attributes, {
        expires: -1,
      })
    );
  };

  public getSet = (name?: string, value?: string) => {
    name && value ? this.set(name, value) : void 0;
    return name ? this.get(name) : this.getAll();
  };

  // public withAttributes = (attributes) => {
  //   return init(
  //     // @ts-ignore
  //     this.converter,
  //     // @ts-ignore
  //     Object.assign({}, this.attributes, attributes)
  //   );
  // };

  // public withConverter = (converter) => {
  //   return init(
  //     // @ts-ignore
  //     Object.assign({}, this.converter, converter),
  //     // @ts-ignore
  //     this.attributes
  //   );
  // };
}

export default new Cookies({ path: '/' });
