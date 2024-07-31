#include "c_path.h"
#include "utf8.h"
typedef struct
{
    ppp_c_string_t *path;
    char *buf;
    size_t buf_len;
    size_t w;
} ppp_c_path_lazybuf_t;
static inline char ppp_c_path_lazybuf_index(ppp_c_path_lazybuf_t *b, size_t i)
{
    return b->buf ? b->buf[i] : b->path->str[i];
}
static int ppp_c_path_lazybuf_append_char(ppp_c_path_lazybuf_t *b, char c)
{
    if (!b->buf)
    {
        if (b->w < b->path->len && b->path->str[b->w] == c)
        {
            b->w++;
            return 0;
        }

        b->buf_len = b->path->len;
        b->buf = malloc(b->buf_len + 1);
        if (!b->buf)
        {
            return -1;
        }
        memcpy(b->buf, b->path->str, b->w);
    }
    b->buf[b->w++] = c;
    return 0;
}
static void ppp_c_path_lazybuf_string(ppp_c_path_lazybuf_t *b, ppp_c_string_t *s)
{
    if (b->buf)
    {
        s->cap = b->buf_len;
        s->str = b->buf;
    }
    else
    {
        s->cap = b->path->cap;
        s->str = b->path->str;
    }
    s->len = b->w;
}
int ppp_c_path_clean_raw(ppp_c_string_t *path, ppp_c_string_t *cleaned)
{
    if (!path->len)
    {
        cleaned->str = ".";
        cleaned->len = 1;
        return 0;
    }

    BOOL rooted = path->str[0] == '/' ? TRUE : FALSE;
    size_t n = path->len;

    // Invariants:
    //	reading from path; r is index of next byte to process.
    //	writing to buf; w is index of next byte to write.
    //	dotdot is index in buf where .. must stop, either because
    //		it is the leading slash or it is a leading ../../.. prefix.
    ppp_c_path_lazybuf_t out = {
        .path = path,
        .buf = 0,
        .buf_len = 0,
        .w = 0,
    };
    size_t r = 0;
    size_t dotdot = 0;
    if (rooted)
    {
        if (ppp_c_path_lazybuf_append_char(&out, '/'))
        {
            return -1;
        }
        r = 1;
        dotdot = 1;
    }

    while (r < n)
    {
        if (path->str[r] == '/')
        {
            r++;
        }
        else if (path->str[r] == '.' &&
                 (r + 1 == n || path->str[r + 1] == '/'))
        {
            r++;
        }
        else if (path->str[r] == '.' &&
                 path->str[r + 1] == '.' &&
                 (r + 2 == n || path->str[r + 2] == '/'))
        {
            // .. element: remove to last /
            r += 2;
            if (out.w > dotdot)
            {
                // can backtrack
                out.w--;
                while (out.w > dotdot &&
                       ppp_c_path_lazybuf_index(&out, out.w) != '/')
                {
                    out.w--;
                }
            }
            else if (!rooted)
            {
                // cannot backtrack, but not rooted, so append .. element.
                if (out.w > 0)
                {
                    if (ppp_c_path_lazybuf_append_char(&out, '/'))
                    {
                        return -1;
                    }
                }
                if (ppp_c_path_lazybuf_append_char(&out, '.'))
                {
                    return -1;
                }
                if (ppp_c_path_lazybuf_append_char(&out, '.'))
                {
                    return -1;
                }
                dotdot = out.w;
            }
        }
        else
        {
            // real path element.
            // add slash if needed
            if (rooted && out.w != 1 || !rooted && out.w != 0)
            {
                if (ppp_c_path_lazybuf_append_char(&out, '/'))
                {
                    return -1;
                }
            }
            // copy element
            for (; r < n && path->str[r] != '/'; r++)
            {
                if (ppp_c_path_lazybuf_append_char(&out, path->str[r]))
                {
                    return -1;
                }
            }
        }
    }

    // Turn empty string into "."
    if (out.w == 0)
    {
        if (out.buf)
        {
            cleaned->str = out.buf;
            cleaned->str[0] = '.';
            cleaned->len = 1;
            cleaned->cap = out.buf_len;
        }
        else
        {
            cleaned->str = ".";
            cleaned->len = 1;
            cleaned->cap = 0;
        }
        return 0;
    }

    ppp_c_path_lazybuf_string(&out, cleaned);
    return 0;
}
int ppp_c_path_clean(ppp_c_string_t *path)
{
    ppp_c_string_t cleaned = {0};
    int err = ppp_c_path_clean_raw(path, &cleaned);
    if (err)
    {
        return err;
    }
    if (path->cap)
    {
        if (path->str != cleaned.str)
        {
            free(path->str);
        }
    }
    *path = cleaned;
    return 0;
}

BOOL ppp_c_path_is_abs_raw(const char *path, size_t path_len)
{
    return path_len && path[0] == '/' ? TRUE : FALSE;
}
void ppp_c_path_base_raw(ppp_c_fast_string_t *output, const char *path, size_t path_len)
{
    if (path_len == 0)
    {
        output->str = ".";
        output->len = 1;
        return;
    }
    // Strip trailing slashes.
    while (path_len > 0 && path[path_len - 1] == '/')
    {
        path_len--;
    }
    // Find the last element
    size_t i = ppp_c_stirng_last_char_raw(path, path_len, '/');
    if (i != -1)
    {
        i++;

        path += i;
        path_len -= i;
    }
    // If empty now, it had only slashes.
    if (path_len == 0)
    {
        output->str = "/";
        output->len = 1;
        return;
    }
    output->str = path;
    output->len = path_len;
}
void ppp_c_path_ext_raw(ppp_c_fast_string_t *output, const char *path, size_t path_len)
{
    for (size_t i = path_len - 1; i != -1 && path[i] != '/'; i--)
    {
        if (path[i] == '.')
        {
            output->str = path + i;
            output->len = path_len - i;
            return;
        }
    }

    output->len = 0;
    output->str = "";
}
void ppp_c_path_split_raw(const char *path, const size_t path_len, ppp_c_fast_string_t *dir, ppp_c_fast_string_t *file)
{
    size_t i = ppp_c_stirng_last_char_raw(path, path_len, '/');
    if (i == -1)
    {
        i = 0;
    }
    else
    {
        i++;
    }
    if (dir)
    {
        dir->len = i;
        dir->str = path;
    }
    if (file)
    {
        file->len = path_len - i;
        file->str = path + i;
    }
}

typedef struct
{
    ppp_c_string_iteratorable_t *raw;
    size_t skip;
    size_t i;
    uint8_t join;
} ppp_c_path_iteratorable_state_t;

static void __ppp_c_path_iterator_next(void *p, ppp_c_string_iterator_t *iter)
{
    ppp_c_path_iteratorable_state_t *state = p;
    while (state->skip != state->i)
    {
        state->raw->next(state->raw->state, iter);
        ++state->i;
        if (!iter->ok)
        {
            return;
        }
    }
    state->raw->next(state->raw->state, iter);
    if (state->join < 2)
    {
        state->join++;
    }
}
static void __ppp_c_path_iterator_reset(void *p)
{
    ppp_c_path_iteratorable_state_t *state = p;
    state->raw->reset(state->raw->state);
    state->i = 0;
    state->join = 0;
}

int ppp_c_path_join(ppp_c_string_t *output, ppp_c_string_iteratorable_t *iteratorable)
{
    ppp_c_string_iterator_t iter;

    ppp_c_path_iteratorable_state_t join_state = {
        .raw = iteratorable,
        .skip = 0,
        .i = 0,
        .join = 0,
    };
    iteratorable->reset(iteratorable->state);
    for (iteratorable->next(iteratorable->state, &iter); iter.ok; iteratorable->next(iteratorable->state, &iter))
    {
        if (iter.len)
        {
            break;
        }
        else
        {
            join_state.skip++;
        }
    }
    if (!iter.ok)
    {
        output->len = 0;
        return 0;
    }
    iteratorable->reset(iteratorable->state);

    char c = '/';
    ppp_c_string_iteratorable_t join_iteratorable = {
        .state = &join_state,
        .reset = __ppp_c_path_iterator_reset,
        .next = __ppp_c_path_iterator_next,
    };
    if (ppp_c_string_join(output, &join_iteratorable, &c, 1))
    {
        return -1;
    }
    if (join_state.join < 2)
    {
        return 0;
    }
    return ppp_c_path_clean(output);
}
// scan_chunk gets the next segment of pattern, which is a non-star string
// possibly preceded by a star.
static uint8_t ppp_c_path_scan_chunk(
    const char *pattern, size_t pattern_len,
    ppp_c_fast_string_t *chunk, ppp_c_fast_string_t *rest)
{
    uint8_t star = 0;
    while (pattern_len > 0 && pattern[0] == '*')
    {
        pattern++;
        pattern_len--;
        star = 1;
    }

    uint8_t inrange = 0;
    size_t i;

    for (i = 0; i < pattern_len; i++)
    {
        switch (pattern[i])
        {
        case '\\':
            // error check handled in matchChunk: bad pattern.
            if (i + 1 < pattern_len)
            {
                i++;
            }
            break;
        case '[':
            inrange = 1;
            break;
        case ']':
            inrange = 0;
            break;
        case '*':
            if (!inrange)
            {
                goto Scan;
            }
            break;
        }
    }

Scan:
    if (chunk)
    {
        chunk->str = pattern;
        chunk->len = i;
    }
    if (rest)
    {
        rest->str = pattern + i;
        rest->len = pattern_len - i;
    }
    return star;
}
// getEsc gets a possibly-escaped character from chunk, for a character class.
static int ppp_c_path_get_esc(
    const char *chunk, size_t chunk_len,
    ppp_utf8_rune_t *r,
    ppp_c_fast_string_t *nchunk)
{
    if (chunk_len == 0 || chunk[0] == '-' || chunk[0] == ']')
    {
        return -1;
    }
    if (chunk[0] == '\\')
    {
        chunk++;
        chunk_len--;
        if (chunk_len == 0)
        {
            return -1;
        }
    }
    int n;
    *r = ppp_utf8_decode(chunk, chunk_len, &n);
    if (*r == PPP_UTF8_RUNE_ERROR && n == 1)
    {
        return -1;
    }
    chunk += n;
    chunk_len -= n;
    if (chunk_len == 0)
    {
        return -1;
    }
    nchunk->str = chunk;
    nchunk->len = chunk_len;
    return 0;
}
// match_chunk checks whether chunk matches the beginning of s.
// If so, it returns the remainder of s (after the match).
// Chunk is all single-character operators: literals, char classes, and ?.
static int ppp_c_path_match_chunk(
    const char *chunk, size_t chunk_len,
    const char *s, size_t s_len,
    ppp_c_fast_string_t *rest,
    uint8_t *ok)
{
    // failed records whether the match has failed.
    // After the match fails, the loop continues on processing chunk,
    // checking that the pattern is well-formed but no longer reading s.
    uint8_t failed = 0;
    while (chunk_len > 0)
    {
        if (!failed && s_len == 0)
        {
            failed = 1;
        }
        switch (chunk[0])
        {
        case '[':
        {
            // character class
            ppp_utf8_rune_t r = 0;
            if (!failed)
            {
                int n;
                r = ppp_utf8_decode(s, s_len, &n);
                s += n;
                s_len -= n;
            }
            chunk++;
            chunk_len--;
            // possibly negated
            uint8_t negated = 0;
            if (chunk_len > 0 && chunk[0] == '^')
            {
                negated = 1;
                chunk++;
                chunk_len--;
            }
            // parse all ranges
            uint8_t match = 0;
            size_t nrange = 0;
            while (1)
            {
                if (chunk_len > 0 && chunk[0] == ']' && nrange > 0)
                {
                    chunk++;
                    chunk_len--;
                    break;
                }
                ppp_utf8_rune_t lo;
                ppp_c_fast_string_t nchunk;
                if (ppp_c_path_get_esc(chunk, chunk_len, &lo, &nchunk))
                {
                    if (ok)
                    {
                        *ok = 0;
                    }
                    if (rest)
                    {
                        rest->str = "";
                        rest->len = 0;
                    }
                    return -1;
                }
                chunk = nchunk.str;
                chunk_len = nchunk.len;
                ppp_utf8_rune_t hi = lo;
                if (chunk[0] == '-')
                {
                    if (ppp_c_path_get_esc(chunk + 1, chunk_len - 1, &hi, &nchunk))
                    {
                        if (ok)
                        {
                            *ok = 0;
                        }
                        if (rest)
                        {
                            rest->str = "";
                            rest->len = 0;
                        }
                        return -1;
                    }
                    chunk = nchunk.str;
                    chunk_len = nchunk.len;
                }
                if (lo <= r && r <= hi)
                {
                    match = 1;
                }
                nrange++;
            }
            if (match == negated)
            {
                failed = 1;
            }
        }
        break;
        case '?':
            if (!failed)
            {
                if (s[0] == '/')
                {
                    failed = 1;
                }
                int n;
                ppp_utf8_decode(s, s_len, &n);
                s += n;
                s_len -= n;
            }
            chunk++;
            chunk_len--;
            break;
        case '\\':
            chunk++;
            chunk_len--;
            if (chunk_len == 0)
            {
                if (ok)
                {
                    *ok = 0;
                }
                if (rest)
                {
                    rest->str = "";
                    rest->len = 0;
                }
                return -1;
            }
        default:
            if (!failed)
            {
                if (chunk[0] != s[0])
                {
                    failed = 1;
                }
                s++;
                s_len--;
            }
            chunk++;
            chunk_len--;
            break;
        }
    }

    if (failed)
    {
        if (rest)
        {
            rest->len = 0,
            rest->str = "";
        }
        if (ok)
        {
            *ok = 0;
        }
        return 0;
    }
    if (rest)
    {
        rest->len = s_len,
        rest->str = s;
    }
    if (ok)
    {
        *ok = 1;
    }
    return 0;
}
int ppp_c_path_match_raw(const char *_pattern, size_t _pattern_len, const char *name, size_t name_len)
{
    ppp_c_fast_string_t pattern = {
        .str = _pattern,
        .len = _pattern_len,
    };
    uint8_t star;
    ppp_c_fast_string_t chunk;
    ppp_c_fast_string_t t;
    uint8_t ok;
    int err;
    while (pattern.len)
    {
        star = ppp_c_path_scan_chunk(pattern.str, pattern.len, &chunk, &pattern);
        if (star && chunk.len == 0)
        {
            // Trailing * matches rest of string unless it has a /.
            return ppp_c_stirng_first_char_raw(name, name_len, '/') == -1 ? 0 : 1;
        }
        err = ppp_c_path_match_chunk(
            chunk.str, chunk.len,
            name, name_len,
            &t, &ok);
        // if we're the last chunk, make sure we've exhausted the name
        // otherwise we'll give a false result even if we could still match
        // using the star
        if (ok && (t.len == 0 || pattern.len > 0))
        {
            name = t.str;
            name_len = t.len;
            continue;
        }
        if (err)
        {
            return -1;
        }
        if (star)
        {
            // Look for match skipping i+1 bytes.
            // Cannot skip /.
            for (size_t i = 0; i < name_len && name[i] != '/'; i++)
            {
                err = ppp_c_path_match_chunk(
                    chunk.str, chunk.len,
                    name + i + 1, name_len - i - 1,
                    &t, &ok);
                if (ok)
                {
                    // if we're the last chunk, make sure we exhausted the name
                    if (pattern.len == 0 && t.len > 0)
                    {
                        continue;
                    }
                    name = t.str;
                    name_len = t.len;
                    goto Pattern;
                }
                if (err)
                {
                    return -1;
                }
            }
        }
        // Before returning false with no error,
        // check that the remainder of the pattern is syntactically valid.
        while (pattern.len > 0)
        {
            ppp_c_path_scan_chunk(pattern.str, pattern.len, &chunk, &pattern);
            if (ppp_c_path_match_chunk(
                    chunk.str, chunk.len,
                    "", 0,
                    0, 0))
            {
                return -1;
            }
        }
        return 1;
    Pattern: //
        ;
    }
    return name_len == 0 ? 0 : 1;
}