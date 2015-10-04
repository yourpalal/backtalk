export class Trie<T> {
    private children: {
        [name: string]: Trie<T>
    } = {};

    private v: T;

    put(key: string, val: T): Trie<T> {
        return this.insertBy(val, key.split(""));
    }

    get(key: string): T {
        var child = this.getChild(key);
        if (child) {
            return child.v;
        }
        return null;
    }

    getChild(key: string): Trie<T> {
        return this.traverseBy(key.split(""));
    }

    private insertBy(value: T, key: string[], index: number = 0): Trie<T> {
        if (index >= key.length) {
            this.v = value;
            return this;
        }

        var child = this.children[key[index]];
        if (!child) {
            child = new Trie<T>();
            this.children[key[index]] = child;
        }

        return child.insertBy(value, key, index + 1);
    }

    traverseBy(key: string[], index: number = 0): Trie<T> {
        if (index >= key.length) {
            return this;
        }

        var child = this.children[key[index]];
        if (child) {
            return child.traverseBy(key, index + 1);
        }
        return null;
    }

    each(f: { (key: string, value: T) }) {
        this.eachByKey([], f);
    }

    private eachByKey(key: string[], f: { (key: string, value: T) }) {
        for (var k in this.children) {
            if (this.children.hasOwnProperty(k)) {
                var child = this.children[k];
                key.push(k);
                if (child.v) {
                    f(key.join(""), child.v);
                }
                child.eachByKey(key, f);
                key.pop();
            }
        }
    }

    merge(t: Trie<T>) {
        t.each((key, val) => {
            this.put(key, val);
        });
    }
}
